import React from 'react';

import { Activity, Container, Title } from './PendingActivity.Components';
import FlexState from '../../states/FlexState';

class PendingActivity extends React.PureComponent {
  state = {
    pendingActivity: undefined
  }

  activityCheckInterval

  componentDidMount() {
    this.activityCheckInterval = setInterval(() => {
      const pendingActivity = FlexState.pendingActivity;
      
      if (pendingActivity?.sid !== this.state.pendingActivity?.sid) {
        this.setState({ pendingActivity });
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.activityCheckInterval);
  }

  render() {
    return (
      this.state.pendingActivity && this.state.pendingActivity.isUserSelected ? (
        <Container>
          <Title>Pending Activity</Title>
          <Activity>{this.state.pendingActivity.name}</Activity>
        </Container>
      ) : null
    )
  }
}

export default PendingActivity;
