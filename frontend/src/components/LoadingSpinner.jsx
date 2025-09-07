import React from 'react';
import PropTypes from 'prop-types';
import { FaSpinner } from 'react-icons/fa';

const LoadingSpinner = ({ message, fullHeight }) => {
  return (
    <div className={`container py-5 text-center ${fullHeight ? 'min-vh-100 d-flex flex-column justify-content-center' : ''}`}>
      <FaSpinner className="fa-spin fs-1 my-3" />
      {message && <p className="fs-5">{message}</p>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  fullHeight: PropTypes.bool
};

export default LoadingSpinner;