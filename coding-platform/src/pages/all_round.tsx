import Navbar from "../components/Navbar";
import CodingPlatform from "../components/coding-platform";
import AddPageContent from "@/components/all_rouds";
import "../app/globals.css"; // Import global styles

const AllRound = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <Navbar />
      <div className="flex-1 overflow-hidden"> {/* Takes remaining space */}
        <AddPageContent /> 
      </div>
    </main>
  );
};

export default AllRound;