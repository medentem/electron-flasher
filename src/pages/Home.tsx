// src/pages/Home.tsx
import type React from "react";
import DeviceCard from "../components/DeviceCard";
import Releases from "../components/Releases";

const Home: React.FC = () => {
  return (
    <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-6 px-12">
      <div className="flex p-px lg:col-span-4">
        <div className="overflow-hidden rounded-lg  bg-gray-50 ring-1 ring-white/15 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem] lg:rounded-bl-[2rem] w-full p-6">
          <DeviceCard />
        </div>
      </div>
      <div className="flex p-px lg:col-span-2">
        <div className="overflow-hidden rounded-lg  bg-gray-50 ring-1 ring-white/15 lg:rounded-tr-[2rem] lg:rounded-br-[2rem] w-full p-6">
          <Releases />
        </div>
      </div>
    </div>
  );
};

export default Home;
