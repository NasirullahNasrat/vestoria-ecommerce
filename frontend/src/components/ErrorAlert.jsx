import React from 'react';
import PropTypes from 'prop-types';
import { FaExclamationTriangle } from 'react-icons/fa';

const ErrorAlert = ({ message, retry, fullHeight }) => {
  return (
    <div className={`container py-5 ${fullHeight ? 'min-vh-100 d-flex flex-column justify-content-center' : ''}`}>
      <div className="alert alert-danger mx-auto" style={{ maxWidth: '600px' }}>
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="fs-3 me-3" />
          <div>
            <h5 className="alert-heading mb-2">Error</h5>
            <p className="mb-3">{message}</p>
            {retry && (
              <button 
                onClick={retry} 
                className="btn btn-outline-danger btn-sm"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ErrorAlert.propTypes = {
  message: PropTypes.string.isRequired,
  retry: PropTypes.func,
  fullHeight: PropTypes.bool
};

export default ErrorAlert;