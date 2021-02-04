import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';

import PendingActivity from './components/PendingActivity';

import './listeners';
import './notifications';

const PLUGIN_NAME = 'ActivityHandlerPlugin';

export default class ActivityHandlerPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    // The core logic of this plugin is in the './listeners' module

    // Using -999 sortOrder to ensure it's always the far left element
		flex.MainHeader.Content.add(
      <PendingActivity key="pending-activity" />,
      { sortOrder: -999, align: 'end' }
		);
  }
}
