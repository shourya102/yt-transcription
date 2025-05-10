import {BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "./pages/Home/Home.tsx";
import Combined from "./pages/Combined/Combined.tsx";

const App = () => {
    return (
        <div>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/combined/:youtube_url" element={<Combined/>}/>
                </Routes>
            </BrowserRouter>
        </div>
    );
};

export default App;