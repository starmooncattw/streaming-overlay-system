import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="settings-page">
      <h2>Settings</h2>
      <div className="settings-content">
        <div className="settings-section">
          <h3>Account Settings</h3>
          <p>Manage your account preferences and security settings.</p>
        </div>
        <div className="settings-section">
          <h3>Notification Preferences</h3>
          <p>Configure how you receive notifications.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
