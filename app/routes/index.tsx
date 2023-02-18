import excersises from "../assets/excersises.png";
import greg from "../assets/greg.jpg";
import progress from "../assets/progress.png";
import {useRef,useEffect,useState} from 'react';
import { ViewBoardsIcon, BookOpenIcon,ChatIcon} from "@heroicons/react/outline";
export function ErrorBoundary({ error }: any) {
  console.log('errror', error)
}
export default function Index() {

  const getFadeLeftStyles = (isfadeLeftInViewPort:any) => ({
    transition: 'all 1s ease-in',
    opacity: isfadeLeftInViewPort ? '1' : '0',
    transform: isfadeLeftInViewPort ? '' : 'translateX(-100%)'
});

const getFadeRightStyles = (isfadeRightInViewPort:any) => ({
    transition: 'all 1s ease-in',
    opacity: isfadeRightInViewPort ? '1' : '0',
   // transform: isfadeRightInViewPort ? 'translateXY(50%)': 'translateXY(-100%)'
});
const [animatedView, setAnimatedView] = useState({
  section1: false,
  section2: false,
  section3: false,
});
const ourRef = useRef(null),
anotherRef = useRef(null),
refThree = useRef(null);


useEffect(() => {
  const topPos = (element:any) => element?.getBoundingClientRect()?.top;
  const div1Pos = topPos(ourRef.current),
    div2Pos = topPos(anotherRef.current),
    div3Pos = topPos(refThree.current);

  const onScroll = () => {
    const scrollPos = window.scrollY + window.innerHeight;
    if (div1Pos < scrollPos) {
      setAnimatedView(state => ({ ...state, section1: true }));
    }
     else if (div2Pos < scrollPos) {
      setAnimatedView(state => ({ ...state, section2: true }));
    } else if (div3Pos < scrollPos) {
      setAnimatedView(state => ({ ...state, section3: true }));
    }
  };

  window.addEventListener("scroll", onScroll);
  return () => window.removeEventListener("scroll", onScroll);
}, []);


  return (
    <>
    <section>
    <div className="container mx-auto px-6 text-center pb-52">
        <img src={greg} alt="Gregory Kirtsias" className="h-30 rounded-full md:max-w-4xl md:ml-60" />
        <h1
          className="max-w-2xl mx-auto mb-10 text-3xl font-bold leading-normal  md:text-4xl"
        >
          Ασκήσεις και θέματα μαθηματικών.
        </h1>
        <p className="max-w-sm mx-auto mb-10 text-sm md:max-w-xl md:text-lg">
          Στο GregKyrMaths  θα βρεις  ασκήσεις, θέματα, βιβλία και διδακτικό υλικό,
          για μαθητές όλων των εκπαιδευτικών βαθμίδων.
        </p>
        <a href="#" className="inline-flex items-center px-3 py-3 text-sm font-medium text-center text-white bg-orange-600 rounded-lg hover:bg-orange-800 focus:ring-4 focus:outline-none focus:ring-orange-300 dark:bg-blue-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800">
             Ας ξεκινήσουμε
            <svg aria-hidden="true" className="w-4 h-4 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20"
             xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"></path></svg>
         </a>
      </div>
    </section>
     <section className="bg-gray-50 dark:bg-darkBlue1">
      <div className="container mx-auto px-6 pb-32" ref={refThree} style={getFadeLeftStyles(animatedView.section3)}>
        <div className="flex flex-col space-y-24 text-center md:flex-row md:space-y-0"> 
          <div className="flex flex-col items-center space-y-2 md:w-1/2">
            <div className="flex items-center justify-center mb-6">
              <img src={excersises} className='w-60 h-60 rounded rounded-3xl shadow-md' alt="Ασκήσεις Μαθηματικών" />
            </div>
            <h3 className="text-xl font-bold">Ασκήσεις Μαθηματικών</h3>
            <p className="max-w-md">
              Άλυτες και λυμένες ασκήσεις και πολλαπλής επιλογής για τάξεις γυμνασίου, λυκείου και πανεπιστήμιου.
            </p>
          </div>
      
          <div className="flex flex-col items-center space-y-2 md:w-1/2">
            <div className="flex items-center justify-center h-24 mb-6">
              <ViewBoardsIcon className='w-24' />
            </div>
            <h3 className="text-xl font-bold">Διδακτικό υλικό</h3>
            <p className="max-w-md">
              Οπτικό ακουστικό υλικό με καθοδήγηση και επεξήγηση μαθηματικών.
            </p>
          </div>
        </div>
        <div className="flex flex-col space-y-24 mt-28 text-center md:flex-row md:space-y-0">
          <div className="flex flex-col items-center space-y-2 md:w-1/2">
            <div className="flex items-center justify-center h-24 mb-6">
              <BookOpenIcon className='w-36' />
            </div>
            <h3 className="text-xl font-bold">Βιβλία</h3>
            <p className="max-w-md">
              Βιβλία μαθηματικών με πολύπλοκες ασκήσεις.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 md:w-1/2">
            <div className="flex items-center justify-center h-24 mb-6">
              <img src={progress}  className='w-24' alt="Λύσε ασκήσεις" />
            </div>
            <h3 className="text-xl font-bold">Εξάσκηση</h3>
            <p className="max-w-md">
             Ασκήσεις εμπέδωσης και αξιολόγησης.
            </p>
          </div>
        </div>
      </div>
    </section>
    <section className="w-10/12 mx-auto px-6 pb-32  bg-gray-100 rounded-t-md mb-6">
    <div  ref={anotherRef} style={getFadeRightStyles(animatedView.section2)} className='flex flex-row justify-end items-center flex-wrap'>
      <h1 className="text-xl font-bold">Online chatting για απορίες και συζήτηση</h1>
      <ChatIcon className='w-72 animate-[wiggle_3s_ease-in-out_infinite]' stroke="rgba(217, 119, 6)"/>
   </div>
    </section>
    </>
  );
}
