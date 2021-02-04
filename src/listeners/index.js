import { Actions, Manager, Notifications, TaskHelper } from '@twilio/flex-ui';

import FlexState from '../states/FlexState';
import WorkerState from '../states/WorkerState';
import {
  Activity,
	FlexNotification,
	ReservationEvents
} from '../enums';

const manager = Manager.getInstance();
const reservationListeners = new Map();

const availableActivity = FlexState.getActivityByName(Activity.available);
// Update 'Activity.onATask' value to match the activity name you're
// using to indicate an agent has an active task
const onTaskActivity = FlexState.getActivityByName(Activity.onATask);
// Update 'Activity.wrapup' value to match the activity name you're
// using to indicate an agent's tasks are in wrapup status
const wrapupActivity = FlexState.getActivityByName(Activity.wrapup);

// The activities in this array can only be set programmatically and will
// not be stored as pending activities to switch the user back to
const systemActivities = [
  Activity.onATask,
  Activity.wrapup
];

//#region Manager event listeners and handlers
manager.events.addListener('pluginsLoaded', () => {
  initialize();
  FlexState.initialize();
});
//#endregion Manager event listeners and handlers

//#region Supporting functions
const shouldStoreCurrentActivitySid = () => {
	return !systemActivities.map(a => a.toLowerCase())
		.includes(WorkerState.workerActivityName.toLowerCase());
}

const storeCurrentActivitySidIfNeeded = () => {
	if (shouldStoreCurrentActivitySid()) {
		const { workerActivityName, workerActivitySid } = WorkerState;

		console.debug('Storing current activity as previous activity:', workerActivityName);
		FlexState.storePendingActivityChange(workerActivityName, workerActivitySid);
	}
}

const canChangeWorkerActivity = (targetActivitySid) => {
	let canChange = true;

  // TaskRouter will not allow a worker to change from an available activity
  // to any other activity if the worker has a pending reservation without
  //  rejecting that reservation, which isn't what we want to do in this use case
	if (FlexState.isAnAvailableActivityBySid(targetActivitySid)
		&& FlexState.hasPendingTask
	) {
		canChange = false;
	}

	return canChange;
};

const setWorkerActivity = (newActivitySid, clearPendingActivity) => {
	try{
    const targetActivity = FlexState.getActivityBySid(newActivitySid);

		if (!canChangeWorkerActivity(newActivitySid)) {
      console.debug('setWorkerActivity: Not permitted to change worker activity at this time. '
        + 'Target activity:', targetActivity?.name);
			return;
		}
		if (WorkerState.workerActivitySid === newActivitySid) {
			console.debug(`setWorkerActivity: Worker already in activity "${targetActivity?.name}". No change needed.`);
		}
		else {
			console.log("setWorkerActivity: ", targetActivity?.name);
			Actions.invokeAction('SetActivity', { activitySid: newActivitySid, isInvokedByPlugin: true });
		}
		if (clearPendingActivity) {
			FlexState.clearPendingActivityChange();
		}
	}catch(error){
		console.error("setWorkerActivity: Error setting worker activity SID", error);
	}
}

const delayActivityChange = (activityName, activitySid) => {
	Notifications.showNotification(FlexNotification.activityChangeDelayed, { activityName });

	FlexState.storePendingActivityChange(activityName, activitySid, true);
}

const validateAndSetWorkerActivity = () => {
	console.debug('otherFlexSessionDetected:', FlexState.otherSessionDetected);

	if (FlexState.otherSessionDetected) {
		console.warn('Another flex session was detected. '
			+ 'Not validating or resetting worker activity')
		
		return;
	}

	const pendingActivity = FlexState.pendingActivity;
  const { workerActivitySid, workerActivityName } = WorkerState;
  
	if(!FlexState.hasLiveCallTask && FlexState.hasWrappingTask) {
		console.log('Resetting "Wrap Up" Activity from:', workerActivityName);
		setWorkerActivity(wrapupActivity?.sid);
	}
	else if (workerActivitySid === wrapupActivity?.sid && !FlexState.hasWrappingTask) {
		if (pendingActivity) {
			console.log(`Setting worker from "${wrapupActivity?.name}" to pending activity:`, pendingActivity?.name);
			setWorkerActivity(pendingActivity?.sid, true);
		}
		else {
			console.log(`Setting worker from "${wrapupActivity?.name}" to default activity:`, availableActivity?.name);
			setWorkerActivity(availableActivity?.sid);
		}
	}
	else if (workerActivitySid === FlexState.offlineActivitySid && !FlexState.hasWrappingTask) {
		FlexState.clearPendingActivityChange();
	}
}
//#endregion Supporting functions

//#region Flex Action listeners and handlers
Actions.addListener('beforeSetActivity', (payload, abortFunction) => {
  const { activityName, activitySid, isInvokedByPlugin } = payload;

  if (isInvokedByPlugin) {
    // We will allow any worker activity change invoked by the plugin to
    // proceed as normal
    return;
  }

  if (systemActivities.map(a => a.toLowerCase()).includes(activityName.toLowerCase())) {
    abortFunction();
    Notifications.showNotification(FlexNotification.restrictedActivities, { activityName });
  }
  else if (FlexState.hasActiveCallTask || FlexState.hasWrappingTask) {
    abortFunction();
    delayActivityChange(activityName, activitySid);
  }
});

Actions.addListener('beforeStartOutboundCall', async () => {
	storeCurrentActivitySidIfNeeded();

	setWorkerActivity(onTaskActivity?.sid);

	await WorkerState.waitForWorkerActivityChange(onTaskActivity?.sid);
});
//#endregion Flex Action listeners and handlers

//#region Reservation listeners and handlers
const stopReservationListeners = (reservation) => {
	const listeners = reservationListeners.get(reservation);
	if (listeners) {
		listeners.forEach(listener => {
		reservation.removeListener(listener.event, listener.callback);
		});
		reservationListeners.delete(reservation);
	}
};

const handleReservationAccept = async (reservation) => {
  console.log(`### handleReservationAccept ${reservation.sid}`);
  
	storeCurrentActivitySidIfNeeded();

	setWorkerActivity(onTaskActivity?.sid);
}

const handleReservationWrapup = async (reservation) => {
	console.log(`handleReservationWrapup: `, reservation);

	if(FlexState.hasLiveCallTask
		|| FlexState.hasPendingTask
		|| WorkerState.workerActivityName === Activity.wrapup
	){
		return;
	}

  setWorkerActivity(wrapupActivity?.sid);
}

const handleReservationEnded = async (reservation, eventType) => {
	console.log(`handleReservationEnded: `, reservation);

	const pendingActivity = FlexState.pendingActivity;

	if(eventType === ReservationEvents.timeout
		|| FlexState.hasActiveCallTask
		|| FlexState.hasWrappingTask
		|| WorkerState.workerActivitySid === pendingActivity?.sid
	){
		return;
	}

	if (pendingActivity) {
		console.debug('handleReservationEnded, Setting worker to stored activity', pendingActivity.name);
		setWorkerActivity(pendingActivity.sid, true);
	} else {
		console.debug('handleReservationEnded, No pending activity. Setting worker to default activity:', availableActivity?.name);
		setWorkerActivity(availableActivity?.sid);
	}
}

const handleReservationUpdated = (event, reservation) => {
	console.debug('Event, reservation updated', event, reservation);
	switch (event) {
		case ReservationEvents.accepted: {
			handleReservationAccept(reservation);
			break;
    }
    case ReservationEvents.wrapup: {
			handleReservationWrapup(reservation);
			break;
		}
		case ReservationEvents.timeout: {
      handleReservationEnded(reservation, ReservationEvents.timeout);
      stopReservationListeners(reservation);
			break;
    }
		case ReservationEvents.completed:
		case ReservationEvents.rejected:
		case ReservationEvents.canceled:
		case ReservationEvents.rescinded: {
			handleReservationEnded(reservation);
			stopReservationListeners(reservation);
			break;
		}
		default:
		  // Nothing to do here
	}
};

const initReservationListeners = (reservation) => {
	const trueReservation = reservation.addListener ? reservation : reservation.source;
	stopReservationListeners(trueReservation);
	const listeners = [];
	Object.values(ReservationEvents).forEach(event => {
		const callback = () => handleReservationUpdated(event, trueReservation);
		trueReservation.addListener(event, callback);
		listeners.push({ event, callback });
	});
	reservationListeners.set(trueReservation, listeners);
};

const handleNewReservation = (reservation) => {
	console.debug('new reservation', reservation);
	initReservationListeners(reservation);
};

const handleReservationCreated = async (reservation) => {
	handleNewReservation(reservation);

  storeCurrentActivitySidIfNeeded();

  // For outbound calls, the agent is immediately joined to the conference
  // and hearing ring tone before the reservation is accepted, so we need
  // to change their activity as soon as the outbound reservation is created
  const task = TaskHelper.getTaskByTaskSid(reservation.sid);
  console.debug('isInitialOutboundAttemptTask:', TaskHelper.isInitialOutboundAttemptTask(task));
  if (TaskHelper.isInitialOutboundAttemptTask(task)) {
    setWorkerActivity(onTaskActivity?.sid);
  }
}

manager.workerClient.on('reservationCreated', handleReservationCreated);
//#endregion Reservation listeners and handlers

export const initialize = () => {
  validateAndSetWorkerActivity();

  for (const reservation of FlexState.workerTasks.values()) {
		handleNewReservation(reservation)
  }
}
