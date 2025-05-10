import {BiSearch} from "react-icons/bi";
import {CgSpinner, CgYoutube} from "react-icons/cg";
import {AiFillExclamationCircle} from "react-icons/ai";
import Header from "../../components/Header/Header.tsx";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {toast, ToastContainer} from "react-toastify";
import Footer from "../../components/Footer/Footer.tsx";

const Home = () => {
    const [searchValue, setSearchValue] = useState<string>("")
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);

    const handleSearch = () => {
        if (searchValue && !localStorage.getItem(searchValue.split('v=')[1])) {
            if (localStorage.getItem('user')) {
                axios.post('http://localhost:5000/search', {'query': searchValue}, {
                    headers: {
                        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user') as string).access_token}`
                    }
                }).then(res => {
                    console.log(res.data);
                }).catch(e => {
                    console.log(e)
                });
            }
            setLoading(true);
            axios.post('http://localhost:5000/summary/all', {'video_url': searchValue})
                .then(res => {
                    console.log(res.data);
                    localStorage.setItem(searchValue.split('v=')[1], JSON.stringify(res.data))
                    setLoading(false);
                    navigate(`/combined/${searchValue.split('v=')[1]}`)
                }).catch(e => {
                toast(e.response.data.error, {
                    type: 'error',
                    theme: 'dark',
                    autoClose: 5000,
                    position: 'top-center'
                });
                console.log(e)
                setLoading(false);
            })
        } else {
            navigate(`/combined/${searchValue.split('v=')[1]}`);
        }
    }

    return (
        <div className="custom-gradient flex flex-col gap-8 relative w-full min-h-screen">
            <Header/>
            <div className="w-full h-full px-4 flex-grow flex justify-center items-center">
                <div className="flex flex-col w-full max-w-2xl md:w-2/3 items-center gap-4">
                    <label htmlFor="search"
                           className="text-neutral-300 text-3xl flex justify-center items-center gap-2 font-bold"><span>Youtube URL</span>
                        <CgYoutube size={28} color="red"/></label>
                    <input id="search" type="text" placeholder="Search here..."
                           value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
                           className="w-full text-neutral-100 placeholder:text-neutral-400 bg-neutral-700 rounded-2xl p-4"/>
                    <button
                        onClick={handleSearch}
                        className="bg-blue-600 hover:bg-blue-500 transition-colors duration-300 cursor-pointer text-neutral-100 p-3 flex w-full md:w-1/3 justify-center items-center gap-2 rounded-2xl">
                        <span>Summarize</span>
                        {!loading ? <span><BiSearch/></span> : <span className="animate-spin"><CgSpinner/></span>}
                    </button>
                    <div className="break-words mt-4 flex gap-2 justify-center items-center text-neutral-300 text-sm">
                        <AiFillExclamationCircle/> <span>Enter the correct URL of a Youtube Video. For ex. https://www.youtube.com/watch?v=74ijsBhbxSQ</span>
                    </div>
                </div>
            </div>
            <ToastContainer/>
            {localStorage.getItem("user") ? <Footer/> : null}
        </div>
    );
};

export default Home;