import React from "react";
import { FaGithub } from 'react-icons/fa'; 

const Footer = () => {
  return (
    <>
      <footer className="mb-0 text-center">
        <div className="d-flex align-items-center justify-content-center pb-5">
          <div className="col-md-6">
            <p className="mb-3 mb-md-0">
             
             
             </p>
            <a className="text-dark fs-4" href="https://github.com/NasirullahNasrat" target="_blank" rel="noreferrer">
            <FaGithub size={34} style={{ marginRight: '10px' }}  /> Nasirullah Nasrat
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
