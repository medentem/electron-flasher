// src/pages/Home.tsx
import type React from 'react';
import DeviceCard from '../components/DeviceCard';

const Home: React.FC = () => {
  return (
    <div className="flex p-4 content-center justify-center items-center">
      <DeviceCard />
    </div>
  );
};

export default Home;
