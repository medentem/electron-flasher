// src/components/Navbar.tsx
import Steps from "./Steps";

export default function Navbar() {
  return (
    <header className="border-b-slate-700 border-b-2 text-white">
      <nav
        aria-label="Global"
        className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
      >
        <div className="flex">
          <div className="-m-1.5 p-1.5">
            <span className="sr-only">Meshtastic</span>
            <img
              alt=""
              src="https://meshtastic.org/design/logo/svg/Mesh_Logo_White.svg"
              className="h-8 w-auto"
            />
          </div>
        </div>
        <Steps />
        <div className="flex-0">
          <div className="-m-1.5 p-1.5" />
        </div>
      </nav>
    </header>
  );
}
