import React, {ReactNode, useEffect, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {BiDownload, BiSearch} from "react-icons/bi";
import {FcAbout} from "react-icons/fc";
import {CiLogout} from "react-icons/ci";
import {CgProfile} from "react-icons/cg";
import {MdFeedback} from "react-icons/md";
import {IoClose} from "react-icons/io5";
import {GrUpdate} from "react-icons/gr";
import {toast, ToastContainer} from "react-toastify";
import axios from "axios";
import {useNavigate} from "react-router-dom";

type Section = 'profile' | 'history' | 'downloads' | 'feedback' | 'about' | 'logout';

interface SettingsModalProps {
    setShowSettings: (show: boolean) => void;
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

interface ListSectionProps<T> {
    title: string;
    items: T[];
    renderItem: (item: T) => ReactNode;
}

const modalVariants = {
    hidden: {opacity: 0, scale: 0.95},
    visible: {opacity: 1, scale: 1, transition: {duration: 0.2, ease: "easeOut"}},
    exit: {opacity: 0, scale: 0.95, transition: {duration: 0.15}}
};

const sectionVariants = {
    hidden: {opacity: 0, x: 20},
    visible: {opacity: 1, x: 0, transition: {duration: 0.2, ease: "easeOut"}},
    exit: {opacity: 0, x: -20, transition: {duration: 0.15}}
};

const listItemVariants = {
    hidden: {opacity: 0, y: 10},
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {delay: i * 0.05, duration: 0.2}
    })
};

const SettingsModal: React.FC<SettingsModalProps> = ({setShowSettings}) => {
    const [activeSection, setActiveSection] = useState<Section>('profile');
    const [profile, setProfile] = useState<any>(null);
    const [username, setUsername] = useState<string>(profile?.username || '');
    const [email, setEmail] = useState<string>(profile?.email || '');
    const [currentPassword, setCurrentPassword] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [downloads, setDownloads] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<string>('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                if (!user) return;

                const response = await axios.post('http://localhost:5000/profile', {username: user.username}, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.access_token}`
                    }
                });

                const profileData = response.data;
                localStorage.setItem('userProfile', JSON.stringify(profileData));
                setProfile(profileData);
                setUsername(profileData.username);
                setEmail(profileData.email);
                setSearchHistory(profileData.search_history || []);
                setDownloads(profileData.download_history || []);
            } catch (error) {
                console.error(error);
            }
        };
        if (!profile) fetchProfile();
    }, [profile]);

    const handleUpdateProfile = () => {
        if (newPassword !== confirmPassword) {
            toast('Passwords do not match', {type: 'error', theme: 'dark', autoClose: 5000, position: 'top-center'});
            return;
        }

        axios.post('http://localhost:5000/profile/update', {
            username,
            email,
            old_password: currentPassword,
            new_password: newPassword,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') as string).access_token}`
            }
        })
            .then(res => {
                const updatedProfile = res.data;
                localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
                setProfile(updatedProfile);
                setUsername(updatedProfile.username);
                setEmail(updatedProfile.email);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                toast('Profile updated successfully', {
                    type: 'success',
                    theme: 'dark',
                    autoClose: 5000,
                    position: 'top-center'
                });
                const user = JSON.parse(localStorage.getItem('user') as string);
                user.username = updatedProfile.username;
                localStorage.setItem('user', JSON.stringify(user));
                window.location.reload();
            })
            .catch(e => {
                toast(e.response?.data?.error || 'An error occurred', {
                    type: 'error',
                    theme: 'dark',
                    autoClose: 5000,
                    position: 'top-center'
                });
            });
    };

    return (
        <div className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                className="w-full max-w-4xl"
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-neutral-800 h-[90vh] w-full rounded-2xl flex flex-col overflow-y-scroll md:flex-row shadow-2xl"
                >
                    <Sidebar activeSection={activeSection} setActiveSection={setActiveSection}/>

                    <div className="flex-1 flex flex-col relative">
                        <motion.button
                            whileHover={{rotate: 90}}
                            onClick={() => setShowSettings(false)}
                            className="absolute top-4 right-4 rounded-full p-2 hover:bg-neutral-700/50 transition-colors"
                        >
                            <IoClose className="w-6 h-6 text-neutral-300"/>
                        </motion.button>

                        <div className="flex-1 overflow-y-scroll">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSection}
                                    variants={sectionVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="flex flex-col gap-3 p-4 md:p-6"
                                >
                                    {activeSection === 'profile' && (
                                        <ProfileSection
                                            username={username}
                                            email={email}
                                            currentPassword={currentPassword}
                                            newPassword={newPassword}
                                            confirmPassword={confirmPassword}
                                            setUsername={setUsername}
                                            setEmail={setEmail}
                                            setCurrentPassword={setCurrentPassword}
                                            setNewPassword={setNewPassword}
                                            setConfirmPassword={setConfirmPassword}
                                            handleUpdateProfile={handleUpdateProfile}
                                        />
                                    )}
                                    {activeSection === 'history' && <HistorySection searchHistory={searchHistory}/>}
                                    {activeSection === 'downloads' && <DownloadsSection downloads={downloads}/>}
                                    {activeSection === 'feedback' &&
                                        <FeedbackSection feedback={feedback} setFeedback={setFeedback}/>}
                                    {activeSection === 'about' && <AboutSection/>}
                                    {activeSection === 'logout' && <LogoutSection setShowSettings={setShowSettings}/>}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
            <ToastContainer/>
        </div>
    );
};

const ProfileSection: React.FC<{
    username: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    setUsername: (value: string) => void;
    setEmail: (value: string) => void;
    setCurrentPassword: (value: string) => void;
    setNewPassword: (value: string) => void;
    setConfirmPassword: (value: string) => void;
    handleUpdateProfile: () => void;
}> = ({
          username,
          email,
          currentPassword,
          newPassword,
          confirmPassword,
          setUsername,
          setEmail,
          setCurrentPassword,
          setNewPassword,
          setConfirmPassword,
          handleUpdateProfile
      }) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4 pb-4">
            <CgProfile className="w-12 h-12 text-blue-400 p-2 bg-neutral-700 rounded-2xl"/>
            <div>
                <h2 className="text-2xl font-semibold text-neutral-100">Profile Settings</h2>
                <p className="text-neutral-400">Manage your account information</p>
            </div>
        </div>

        <div className="flex flex-col gap-2">
            <InputField label="Username" value={username} onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"/>
            <InputField label="Email" type="email" onChange={(e) => setEmail(e.target.value)} value={email}
                        placeholder="Enter email"/>

            <div className="pt-6 space-y-4">
                <h3 className="text-xl font-semibold text-neutral-100">Change Password</h3>
                <InputField type="password" value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)} label="Current Password"
                            placeholder="••••••••"/>
                <InputField type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            label="New Password" placeholder="••••••••"/>
                <InputField type="password" value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} label="Confirm Password"
                            placeholder="••••••••"/>
                <div className="flex justify-end">
                    <motion.button
                        whileHover={{scale: 1.05}}
                        whileTap={{scale: 0.95}}
                        onClick={handleUpdateProfile}
                        className="p-2 gap-2 flex items-center transition-colors duration-300 bg-blue-600 hover:bg-blue-700 rounded-2xl"
                    >
                        <span>Update Profile</span><span><GrUpdate/></span>
                    </motion.button>
                </div>
            </div>
        </div>
    </div>
);

const HistorySection: React.FC<{ searchHistory: string[] }> = ({searchHistory}) => (
    <ListSection
        title="Search History"
        items={searchHistory}
        renderItem={(item: string) => (
            <div className="flex items-center justify-between group">
                <span className="text-neutral-300">{item}</span>
            </div>
        )}
    />
);

const DownloadsSection: React.FC<{ downloads: string[] }> = ({downloads}) => (
    <ListSection
        title="Downloads"
        items={downloads}
        renderItem={(item: string) => (
            <div className="flex items-center justify-between group">
                <span className="text-neutral-300">{item}</span>
            </div>
        )}
    />
);

const FeedbackSection: React.FC<{ feedback: string; setFeedback: (value: string) => void }> = ({
                                                                                                   feedback,
                                                                                                   setFeedback
                                                                                               }) => {
    const handleFeedback = () => {
        axios.post('http://localhost:5000/feedback', {feedback}, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') as string).access_token}`
            }
        }).then(() => {
            toast('Feedback submitted successfully', {
                type: 'success',
                theme: 'dark',
                autoClose: 5000,
                position: 'top-center'
            });
        }).catch(e => {
            toast(e.response?.data?.error || 'An error occurred', {
                type: 'error',
                theme: 'dark',
                autoClose: 5000,
                position: 'top-center'
            });
        });
    }
    return (
        <>
            <h2 className="text-2xl font-semibold text-neutral-100">Feedback</h2>
            <p className="text-neutral-400">We'd love to hear your thoughts!</p>
            <motion.textarea
                initial="hidden"
                animate="visible"
                transition={{duration: 0.2}}
                rows={5}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="bg-neutral-600 p-4 rounded-2xl focus:ring-1 focus:ring-blue-500 resize-none outline-none transition-all duration-300 ease-in-out w-full text"
                placeholder="Write your feedback here..."
            />
            <div className="flex justify-end">
                <motion.button
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                    onClick={handleFeedback}
                    className="p-2 transition-colors duration-300 bg-blue-600 hover:bg-blue-700 rounded-2xl"
                >
                    Submit Feedback
                </motion.button>
            </div>
        </>
    )
};

const AboutSection: React.FC = () => (
    <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        transition={{duration: 0.3}}
    >
        <h2 className="text-2xl font-semibold text-neutral-100">About</h2>
        <motion.p
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{delay: 0.1}}
            className="text-neutral-400 leading-relaxed"
        >
            Dedicated to providing the best user experience.
            <br/><br/>
            Version 1.0.0 · Built with React & TypeScript
        </motion.p>
    </motion.div>
);

const LogoutSection: React.FC<{ setShowSettings: (show: boolean) => void }> = ({setShowSettings}) => {
    const navigate = useNavigate();
    return (
        <div className="text-center py-8">
            <CiLogout className="w-16 h-16 text-red-400 mx-auto mb-4 p-3 bg-neutral-700 rounded-2xl"/>
            <h2 className="text-2xl font-semibold text-neutral-100 mb-2">Log Out</h2>
            <p className="text-neutral-400 mb-6">Are you sure you want to sign out?</p>
            <div className="flex gap-3 justify-center">
                <motion.button
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                    className="bg-neutral-700 rounded-2xl p-3 hover:bg-neutral-600 transition-colors duration-300"
                    onClick={() => setShowSettings(false)}
                >
                    Cancel
                </motion.button>
                <motion.button
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                    onClick={() => {
                        localStorage.removeItem('user');
                        localStorage.removeItem('userProfile');
                        setShowSettings(false);
                        navigate('/');
                        window.location.reload();
                    }}
                    className="bg-red-600 rounded-2xl p-3 hover:bg-red-700 transition-colors duration-300"
                >
                    Confirm Logout
                </motion.button>
            </div>
        </div>)
};

const Sidebar: React.FC<{
    activeSection: Section;
    setActiveSection: (section: Section) => void;
}> = ({activeSection, setActiveSection}) => {
    const sections: { section: Section; icon: ReactNode; label: string }[] = [
        {section: 'profile', icon: <CgProfile/>, label: 'Profile'},
        {section: 'history', icon: <BiSearch/>, label: 'History'},
        {section: 'downloads', icon: <BiDownload/>, label: 'Downloads'},
        {section: 'feedback', icon: <MdFeedback/>, label: 'Feedback'},
        {section: 'about', icon: <FcAbout/>, label: 'About'},
        {section: 'logout', icon: <CiLogout/>, label: 'Logout'},
    ];

    return (
        <div className="flex flex-row md:flex-col bg-neutral-900/50">
            {sections.map(({section, icon, label}) => (
                <motion.button
                    key={section}
                    whileHover={{scale: 1.05}}
                    whileTap={{scale: 0.95}}
                    onClick={() => setActiveSection(section)}
                    className={`p-4 md:p-5 flex items-center gap-3 flex-shrink-0 transition-colors
                        ${activeSection === section
                        ? 'bg-neutral-800 text-blue-400'
                        : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-100'}`}
                >
                    <span className="text-xl">{icon}</span>
                    <span className="hidden md:inline font-medium">{label}</span>
                </motion.button>
            ))}
        </div>
    );
};

const InputField: React.FC<InputFieldProps> = ({label, ...props}) => (
    <motion.div
        initial={{opacity: 0, y: 5}}
        animate={{opacity: 1, y: 0}}
        className="flex flex-col gap-2"
    >
        {label && <label className="font-medium text-neutral-300">{label}</label>}
        <input
            className="w-full px-4 py-3 bg-neutral-700 rounded-2xl focus:ring focus:ring-blue-600 outline-none transition-all text-neutral-100 placeholder-neutral-500"
            {...props}
        />
    </motion.div>
);

const ListSection = <T, >({title, items, renderItem}: ListSectionProps<T>) => (
    <>
        <h2 className="text-2xl font-semibold text-neutral-100">{title}</h2>
        <p className="text-neutral-400">Recent activities</p>
        <div className="space-y-2 overflow-y-scroll">
            {items.map((item, i) => (
                <motion.div
                    key={i}
                    custom={i}
                    variants={listItemVariants}
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    className="p-4 bg-neutral-700/50 rounded-xl hover:bg-neutral-700 transition-colors"
                >
                    {renderItem(item)}
                </motion.div>
            ))}
        </div>
    </>
);

export default SettingsModal;