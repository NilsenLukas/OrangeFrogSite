import React from "react";
import { Link } from "react-router-dom";
import ViewCorrections from "./ViewCorrections";
import { FaArrowLeft } from 'react-icons/fa';

const ManageCorrections = () => {
  return (
    <div className="flex flex-col w-full min-h-screen h-full p-4 sm:p-6 md:p-8 bg-neutral-900">

      
      <ViewCorrections />
    </div>
  );
};

export default ManageCorrections;
