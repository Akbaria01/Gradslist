import { Outlet } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";


export default function App() {
 return (
   <div className="min-h-screen flex flex-col bg-[#eaecef]">
     <Header />
     <main className="flex-1 w-full px-0 py-0">
       <Outlet />
     </main>
     <Footer />
   </div>
 );
}
