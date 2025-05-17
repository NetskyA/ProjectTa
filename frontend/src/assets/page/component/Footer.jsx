// Footer.jsx

import React, { useEffect, useState } from "react";
import FooterImage from "../../image/background/header.png";
const Footer = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer); 
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = currentDateTime.toLocaleTimeString("id-ID");

  return (
    <footer className="bg-gray-800 text-white text-xs py-2 fixed bottom-0 w-full flex justify-between items-center px-4" style={{fontFamily:"sans-serif"}}>
      <p> <span className="m cursor-pointer hover:text-blue-500"> <a href="https://netskya.github.io/Portofolio-aldi_afendiyanto/">NetSkyA.</a></span> All rights reserved.</p>
      <p>
        {formattedDate} - {formattedTime}
      </p>
    </footer>
  );
};

export default Footer;
