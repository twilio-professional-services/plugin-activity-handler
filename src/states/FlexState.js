import { Manager, TaskHelper } from '@twilio/flex-ui';

class FlexState {
  //#region Static Properties
  _manager = Manager.getInstance();

  accountSid;
  //#endregion Static Properties

  //#region Dynamic Properties
  get flexState() { return this._manager.store.getState().flex; }

  //TODO: Evaluate for removal
  get serviceBaseUrl() { return this.flexState.config.serviceBaseUrl; }

  //TODO: Evaluate for removal
  get userToken() { return this.flexState.session.ssoTokenPayload.token; }
  
  //TODO: Evaluate for removal
  get loginHandler() { return this.flexState.session.loginHandler; }

  //TODO: Evaluate for removal
  get otherSessionDetected() { return this.flexState?.session?.singleSessionGuard?.otherSessionDetected; }

  get offlineActivitySid() { return this._manager.serviceConfiguration.taskrouter_offline_activity_sid; }

  get pendingActivityChangeItemKey() { return `pendingActivityChange_${this.accountSid}`; }

  get pendingActivity() {
    const item = localStorage.getItem(this.pendingActivityChangeItemKey);

    return item && JSON.parse(item);
  }

  //TODO: Evaluate for removal
  get workerCallSid() {
    const { connection } = this.flexState.phone;
    return connection && connection.source.parameters.CallSid;
  }

  get workerActivities() {
    return this.flexState?.worker?.activities || new Map();
  }

  get workerTasks() { return this.flexState.worker.tasks; }

  //TODO: Evaluate for removal
  get hasLiveCallTask() {
    if (!this.workerTasks) return false;

    return [...this.workerTasks.values()]
      .some(task => TaskHelper.isLiveCall(task));
  }

  /**
   * Returns true if there is a pending or live call task
   */
  get hasActiveCallTask() {
    if (!this.workerTasks) return false;

    return [...this.workerTasks.values()]
      .some(task => {
        return TaskHelper.isCallTask(task)
          && (TaskHelper.isPending(task) || TaskHelper.isLiveCall(task))
      });
  }

  //TODO: Evaluate for removal
  /**
   * Returns true if there is a pending or live outbound call task
   */
  get hasActiveOutboundCallTask() {
    if (!this.workerTasks) return false;

    return [...this.workerTasks.values()]
      .some(task => {
        return isOutboundCallTask(task)
          && (TaskHelper.isPending(task) || TaskHelper.isLiveCall(task))
          && !isIncomingTransfer(task)
      });
  }

  //TODO: Evaluate for removal
  get hasRingingOutboundCallTask() {
    if (!this.workerTasks) return false;

    return [...this.workerTasks.values()]
      .some(task => TaskHelper.isInitialOutboundAttemptTask(task)
        && !isIncomingTransfer(task));
  }

  //TODO: Evaluate for removal
  get hasOutboundCallTask() {
    if (!this.workerTasks) return false;

    return [...this.workerTasks.values()]
      .some(task => isOutboundCallTask(task)
        && !isIncomingTransfer(task));
  }

  //TODO: Evaluate for removal
  get hasInboundAcdCall() {
    if (!this.workerTasks) return false;

    return [...this.workerTasks.values()]
      .some(task => isInboundAcdCall(task))
  }

  get hasWrappingTask() {
    if (!this.workerTasks) return false;

    return [...this.workerTasks.values()]
      .some(task => TaskHelper.isInWrapupMode(task))
  }

  get hasPendingTask() {
    if (!this.workerTasks) return false;

    return [...this.workerTasks.values()]
      .some(task => TaskHelper.isPending(task))
  }
  //#endregion Dynamic Properties

  //#region Class Methods
  initialize = () => {
    // Setting accountSid as a static property so it survives after
    // logout when several flexState objects are cleared
    this.accountSid = this.flexState.worker.source.accountSid;
  }

  getActivityBySid = (activitySid) => {
    return this.workerActivities.get(activitySid);
  }

  getActivityByName = (activityName) => {
    const activities = [...this.workerActivities.values()];
    return activities.find(
      a => a?.name?.toLowerCase() === activityName.toLowerCase()
    );
  }

  isAnAvailableActivityBySid = (activitySid) => {
    return this.getActivityBySid(activitySid)?.available;
  }

  storePendingActivityChange = (activityName, activitySid, isUserSelected) => {
    const pendingActivityChange = {
      isUserSelected,
      name: activityName,
      sid: activitySid
    };
  
    localStorage.setItem(this.pendingActivityChangeItemKey, JSON.stringify(pendingActivityChange));
  }

  clearPendingActivityChange = () => {
    localStorage.removeItem(this.pendingActivityChangeItemKey);
  }

  //TODO: Evaluate for removal
  dispatchStoreAction = (payload) => {
    this._manager.store.dispatch(payload);
  }
  //#endregion Class Methods
}

const FlexStateSingleton = new FlexState();

export default FlexStateSingleton;
