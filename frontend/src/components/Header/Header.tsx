import {useEffect, useState} from 'react';
import {AnimatePresence} from "framer-motion";
import Sidebar from "../Sidebar/Sidebar.tsx";
import {GrLogin} from "react-icons/gr";
import {BiRegistered} from "react-icons/bi";
import {Link} from "react-router-dom";
import {CgProfile, CgYoutube} from "react-icons/cg";

const Header = () => {
    const [showSidebar, setShowSidebar] = useState<boolean>(false);
    const [loginVisible, setLoginVisible] = useState<boolean>(false);
    const [registerVisible, setRegisterVisible] = useState<boolean>(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        if (localStorage.getItem('user')) {
            setUser(JSON.parse(localStorage.getItem('user') as string));
            console.log(user);
        }
    }, []);
    return (
        <>
            <div className="grid grid-cols-3 px-4 py-2">
                <button
                    onClick={() => setShowSidebar(true)}
                    className={`cursor-pointer text-neutral-300 text-start text-2xl font-bold`}
                >
                    <span className="hover:bg-neutral-500 transition-colors duration-300">Assistant</span>
                </button>
                <Link to="/" className="text-neutral-300 text-2xl flex items-center justify-center font-bold">
                    <span
                        className="hover:bg-neutral-500 hidden md:flex transition-colors duration-300 items-center gap-2"><CgYoutube
                        size={40}/><span className="hidden lg:inline-block">Youtube Video Summarizer</span></span>
                </Link>
                {user ? <div className="flex justify-end items-center p-3 gap-2 text-lg text-neutral-300">
                        <span><CgProfile size={28}/></span>
                        <span>{user.username}</span>
                    </div> :
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={() => {
                                setShowSidebar(true);
                                setRegisterVisible(false);
                                setLoginVisible(true);
                            }}
                            className="flex items-center cursor-pointer justify-center gap-2 p-3 text-neutral-100 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Login <GrLogin className="inline-block"/>
                        </button>
                        <button
                            onClick={() => {
                                setShowSidebar(true);
                                setRegisterVisible(true);
                                setLoginVisible(false);
                            }}
                            className="flex items-center cursor-pointer justify-center gap-2 p-3 text-neutral-100 bg-gradient-to-tr from-orange-600 to-orange-500 rounded-lg hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            Register <BiRegistered className="inline-block"/>
                        </button>
                    </div>}
                <AnimatePresence>
                    {showSidebar && (
                        <Sidebar
                            // user={user} setUser={setUser}
                            registerVisible={registerVisible}
                            loginVisible={loginVisible} setLoginVisible={setLoginVisible}
                            setRegisterVisible={setRegisterVisible} setShowSidebar={setShowSidebar}/>
                    )}
                </AnimatePresence>
            </div>
        </>);
}

export default Header;