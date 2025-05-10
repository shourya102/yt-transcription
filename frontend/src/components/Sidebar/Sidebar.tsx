import React, {useState} from 'react';
import {IoClose} from "react-icons/io5";
import {AnimatePresence, motion} from "framer-motion";
import {BiArrowBack, BiSend} from "react-icons/bi";
import axios from "axios";
import {CgSpinner} from "react-icons/cg";
import {toast} from "react-toastify";

interface SidebarProps {
    setShowSidebar: (state: boolean) => void
    setLoginVisible: (state: boolean) => void
    setRegisterVisible: (state: boolean) => void
    loginVisible: boolean
    registerVisible: boolean
    // user: any;
    // setUser: (state: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
                                             // user,
                                             // setUser,
                                             setShowSidebar,
                                             setLoginVisible,
                                             setRegisterVisible,
                                             registerVisible,
                                             loginVisible
                                         }) => {
    interface Messages {
        text: string;
        type: string;
    }

    const [messageHistory, setMessageHistory] = useState<Messages[]>([
        {
            text: 'Hello! How can I help you? I am a great assistant!',
            type: 'assistant'
        }
    ]);
    const [message, setMessage] = useState<string>("");
    const [registerUsername, setRegisterUsername] = useState<string>("");
    const [registerEmail, setRegisterEmail] = useState<string>("");
    const [registerPassword, setRegisterPassword] = useState<string>("");
    const [loginUsername, setLoginUsername] = useState<string>("");
    const [loginPassword, setLoginPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const handleLogin = () => {
        setLoading(true);
        axios.post('http://localhost:5000/login', {
            username: loginUsername,
            password: loginPassword
        }).then(res => {
            console.log(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
            setLoading(false);
            window.location.reload();
        }).catch(e => {
            console.log(e);
            toast(e.response.data.error, {type: 'error', theme: 'dark', autoClose: 5000, position: 'top-center'});
            setLoading(false);
        });
    }

    const handleRegister = () => {
        setLoading(true);
        axios.post('http://localhost:5000/register', {
            username: registerUsername,
            email: registerEmail,
            password: registerPassword
        }).then(res => {
            console.log(res.data);
            setRegisterVisible(false);
            setLoginVisible(true);
            setLoading(false);
        }).catch(e => {
            console.log(e);
            toast(e.response.data.error, {type: 'error', theme: 'dark', autoClose: 5000, position: 'top-center'});
            setLoading(false);
        })
    }

    const handleAssistant = () => {
        if (!message) return;
        setMessageHistory(prevState => {
            return [...prevState, {text: message, type: 'user'}];
        })
        setMessage("");
        axios.post('http://localhost:5000/assistant', {
            text_input: message
        }).then(res => {

            setMessageHistory(prevState => {
                return [...prevState, {text: res.data.response, type: 'assistant'}];
            })
        }).catch(e => {
            console.log(e);
        })
    }

    return (
        <motion.div
            key="sidebar"
            initial={{x: "-100%", opacity: 0}}
            animate={{x: 0, opacity: 1}}
            exit={{x: "-100%", opacity: 0}}
            transition={{duration: 0.3, ease: "easeInOut"}}
            className="flex flex-col z-10 absolute inset-0 h-screen gap-4 w-full max-w-2xl md:w-2/3 lg:w-1/3 bg-neutral-700 shadow-xl"
        >
            <div className="flex justify-between items-center p-4 border-b border-neutral-600">
                {!(loginVisible || registerVisible) &&
                    <h1 className="text-neutral-300 text-2xl font-bold">Assistant</h1>}
                <button
                    onClick={() => setShowSidebar(false)}
                    aria-label="Close"
                    className="text-neutral-400 flex-1 justify-end flex items-center cursor-pointer hover:text-neutral-200 transition-colors duration-200"
                >
                    <IoClose size={24}/>
                </button>
            </div>

            <div className="flex flex-col h-full px-4 pb-4 space-y-4 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={loginVisible ? "login" : registerVisible ? "register" : "main"}
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        transition={{duration: 0.2, ease: "easeInOut"}}
                        className="flex-1 p-1 overflow-auto"
                        layout
                    >
                        {(!loginVisible && !registerVisible) ? (
                            <div className="flex flex-col h-full">
                                <div className="flex flex-col overflow-y-scroll flex-grow justify-end">
                                    {messageHistory.map((item: Messages, index: number) => (
                                        <motion.div
                                            key={index}
                                            initial={{opacity: 0, y: 20}}
                                            animate={{opacity: 1, y: 0}}
                                            className={`${item.type === 'assistant' ? 'justify-start' : 'justify-end'} flex mb-4`}
                                        >
                                        <span
                                            className="p-3 bg-blue-600 rounded-2xl sm:w-2/3 text-neutral-300 break-words">
                                          {item.text}
                                        </span>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="flex gap-2 w-full">
                                    <input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Enter a message..."
                                        type="text"
                                        className="bg-neutral-600 text-neutral-100 placeholder:text-neutral-400 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleAssistant}
                                        aria-label="Send message"
                                        className="bg-neutral-600 text-neutral-300 cursor-pointer p-3 rounded-lg hover:bg-neutral-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <BiSend size={20}/>
                                    </button>
                                </div>
                            </div>
                        ) : loginVisible ? (
                            <motion.div
                                key="login"
                                initial={{opacity: 0, x: 20}}
                                animate={{opacity: 1, x: 0}}
                                exit={{opacity: 0, x: -20}}
                                className="flex flex-col p-2.5 h-full"
                            >
                                <div className="flex justify-between">
                                    <h2 className="text-2xl text-blue-600 font-bold">Login</h2>
                                    <button
                                        onClick={() => {
                                            setLoginVisible(false);
                                            setRegisterVisible(false);
                                        }}
                                        className="text-blue-600 cursor-pointer hover:text-blue-500 transition-colors"
                                    >
                                        <BiArrowBack size={24}/>
                                    </button>
                                </div>
                                <div className="mt-8 flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="username" className="text-neutral-300">Username</label>
                                        <input
                                            id="username"
                                            value={loginUsername}
                                            onChange={(e) => setLoginUsername(e.target.value)}
                                            placeholder="Username"
                                            className="p-3 text-neutral-100 placeholder:text-neutral-400 bg-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            type="text"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="password" className="text-neutral-300">Password</label>
                                        <input
                                            id="password"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            placeholder="Password"
                                            className="p-3 text-neutral-100 placeholder:text-neutral-400 bg-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            type="password"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setRegisterVisible(true);
                                            setLoginVisible(false);
                                        }}
                                        className="text-neutral-300 my-4 cursor-pointer hover:text-neutral-100 transition-colors text-center"
                                    >
                                        Don't have an account?
                                    </button>
                                    <motion.button layout onClick={handleLogin}
                                                   className="bg-blue-600 p-3 flex gap-2 justify-center items-center rounded-lg cursor-pointer hover:bg-blue-500 font-semibold text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <span>Login</span> {loading &&
                                        <span className="animate-spin"><CgSpinner size={28}/></span>}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="register"
                                initial={{opacity: 0, x: 20}}
                                animate={{opacity: 1, x: 0}}
                                exit={{opacity: 0, x: -20}}
                                className="flex flex-col p-2.5 h-full"
                            >
                                <div className="flex justify-between">
                                    <h2 className="text-2xl text-orange-600 font-bold">Register</h2>
                                    <button
                                        onClick={() => {
                                            setLoginVisible(false);
                                            setRegisterVisible(false);
                                        }}
                                        className="text-orange-600 cursor-pointer hover:text-orange-500 transition-colors"
                                    >
                                        <BiArrowBack size={24}/>
                                    </button>
                                </div>
                                <div className="mt-8 flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="username" className="text-neutral-300">Username</label>
                                        <input
                                            id="username"
                                            value={registerUsername}
                                            onChange={(e) => setRegisterUsername(e.target.value)}
                                            placeholder="Username"
                                            className="p-3 text-neutral-100 placeholder:text-neutral-400 bg-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            type="text"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="email" className="text-neutral-300">Email</label>
                                        <input
                                            id="email"
                                            value={registerEmail}
                                            onChange={(e) => setRegisterEmail(e.target.value)}
                                            placeholder="Email"
                                            className="p-3 text-neutral-100 placeholder:text-neutral-400 bg-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            type="email"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="password" className="text-neutral-300">Password</label>
                                        <input
                                            id="password"
                                            value={registerPassword}
                                            onChange={(e) => setRegisterPassword(e.target.value)}
                                            placeholder="Password"
                                            className="p-3 text-neutral-100 placeholder:text-neutral-400 bg-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            type="password"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setLoginVisible(true);
                                            setRegisterVisible(false);
                                        }}
                                        className="text-neutral-300 my-4 cursor-pointer hover:text-neutral-100 transition-colors text-center"
                                    >
                                        Already have an account?
                                    </button>
                                    <motion.button layout
                                                   onClick={handleRegister}
                                                   className="bg-orange-600 p-3 flex justify-center gap-2 items-center rounded-lg cursor-pointer hover:bg-orange-500 font-semibold text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500">
                                        <span>Register</span> {loading &&
                                        <span className="animate-spin"><CgSpinner size={28}/></span>}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/*{user ? <div*/}
            {/*        className="border-t border-neutral-600 flex justify-between items-center p-4 text-neutral-300 text-lg gap-1">*/}
            {/*        <div className="flex items-center gap-1">*/}
            {/*            <span className="rounded-full p-2"><CgProfile size={28}/></span>*/}
            {/*            <span>{user ? user.username : '??'}</span>*/}
            {/*        </div>*/}
            {/*        <button onClick={() => {*/}
            {/*            if (localStorage.getItem('user')) {*/}
            {/*                localStorage.removeItem('user');*/}
            {/*                localStorage.removeItem('userProfile');*/}
            {/*                setUser(null);*/}
            {/*                window.location.reload();*/}
            {/*            }*/}
            {/*        }} className="p-2 hover:text-neutral-100 transition-colors duration-300"><GrLogout size={28}/></button>*/}
            {/*    </div> :*/}
            {/*    <div className="grid grid-cols-2 gap-4 p-4 border-t border-neutral-600">*/}
            {/*        <button*/}
            {/*            onClick={() => {*/}
            {/*                setRegisterVisible(false);*/}
            {/*                setLoginVisible(true);*/}
            {/*            }}*/}
            {/*            className="flex items-center cursor-pointer justify-center gap-2 p-3 text-neutral-100 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"*/}
            {/*        >*/}
            {/*            Login <GrLogin className="inline-block"/>*/}
            {/*        </button>*/}
            {/*        <button*/}
            {/*            onClick={() => {*/}
            {/*                setRegisterVisible(true);*/}
            {/*                setLoginVisible(false);*/}
            {/*            }}*/}
            {/*            className="flex items-center cursor-pointer justify-center gap-2 p-3 text-neutral-100 bg-gradient-to-tr from-orange-600 to-orange-500 rounded-lg hover:opacity-90 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"*/}
            {/*        >*/}
            {/*            Register <BiRegistered className="inline-block"/>*/}
            {/*        </button>*/}
            {/*    </div>}*/}
        </motion.div>
    );
};

export default Sidebar;