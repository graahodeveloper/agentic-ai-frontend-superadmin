'use client';

import React from 'react';
import LoginComponent from '@/components/auth/login';
import Image from 'next/image';

const AuthPage = () => {


  return (
    <div className="min-h-screen bg-[linear-gradient(-90deg,#fff_-11.17%,#8082ff_100%)] flex">
      {/* Left Side - Hero Section */}
      <div className="w-1/2 flex flex-col items-center text-white p-8 lg:p-12 mt-20 relative">
        {/* Hero Text */}
        <div className="text-center max-w-lg mt-2">
          <h1 className="text-3xl lg:text-3xl font-semibold mb-5 leading-tight whitespace-nowrap">
            Deploy an AI Agent in Minutes
          </h1>
          <h1 className="text-2xl lg:text-2xl font-normal leading-tight">
            Bit of know it all!<br />
          </h1>
          <h1 className="text-2xl lg:text-2xl font-semibold mb-6 leading-tight">
            10x your productivity
          </h1>
        </div>

        {/* Dashboard Preview Image */}
        <div className="relative">
          <div className="relative w-130 h-90 ">
            <Image
              src="/images/auth_page_image.png"
              alt="Dashboard Preview"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-1/2 flex flex-col justify-center items-center p-14 ">
        <div className="w-full h-full bg-white rounded-3xl shadow-lg p-8 flex justify-center">
          <div className="w-full max-w-md justify-center items-center mb-20">
            <div className="mb-10 text-center">
              <div className="flex justify-center mb-15">
                <Image 
                  src="/graaho_logo.png" 
                  alt="Graaho Logo"
                  width={120}
                  height={60}
                />
              </div>
              <div className="flex border-b border-gray-200">
                <div className="flex-1 pb-3 text-base font-semibold border-b-2 border-[var(--color-auth-teal)] text-[var(--color-auth-teal)] scale-105">
                  Sign In
                </div>
              </div>
            </div>

            {/* Form Content */}
            <LoginComponent 
              onSwitchToRegister={() => console.log('Registration not available')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;