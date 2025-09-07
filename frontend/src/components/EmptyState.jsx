import React from 'react';
import PropTypes from 'prop-types';

const EmptyState = ({ icon, title, subtitle, action }) => {
  return (
    <div className="text-center py-5 my-5">
      <div className="mb-4">{icon}</div>
      <h3 className="h4">{title}</h3>
      <p className="text-muted">{subtitle}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  action: PropTypes.node
};

export default EmptyState;