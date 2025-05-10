import {CiSettings} from "react-icons/ci";
import SettingsModal from "../SettingsModal/SettingsModal.tsx";
import {useState} from "react";
import {AnimatePresence} from "framer-motion";

const Footer = () => {
    const [showSettings, setShowSettings] = useState(false);
    return (
        <div
            className="fixed bottom-0 text-neutral-300 hover:text-neutral-100 transition-colors duration-300 right-0 m-4">
            <button onClick={() => setShowSettings(true)}><CiSettings size={28}/></button>
            <AnimatePresence>
                {showSettings && <SettingsModal setShowSettings={setShowSettings}/>}
            </AnimatePresence>

        </div>
    );
};

export default Footer;