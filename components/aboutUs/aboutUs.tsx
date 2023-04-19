
// 1. να βάλλω quotes 
// 2. να βάλλω link

import greg from '../../app/assets/greg.jpg';
import konna from '../../app/assets/konstantina.png';
const AboutUsHoc =()=> {
    return (
        <>
        <div className="xl:mx-auto xl:container 2xl:px-20 px-6 py-20">
                <h1 className="text-5xl font-black  leading-10 text-gray-800 text-center">Σχετικά με εμάς</h1>
                <div className="flex flex-wrap items-stretch xl:justify-between justify-center mt-16 xl:gap-6 gap-4">
                    <div className="lg:w-96 w-80">
                        <img src={greg} className="h-72 w-full object-cover object-center rounded-t-md" alt="woman smiling" />
                        <div className="bg-white shadow-md rounded-md py-4 text-center">
                            <p className="text-base font-medium leading-6 text-gray-600">Γρηγόρης Κυρτσιάς</p>
                            <p className="text-base leading-6 mt-2 text-gray-800">Μαθηματικός</p>
                        </div>
                    </div>
                    <div className="bg-orange-600 rounded-md lg:w-96 w-80 flex flex-col items-center justify-center md:py-0 py-12">
                        <h3 className="text-2xl font-semibold leading-6 text-center text-white">Έστω ότι μαθηματικός με μουστάκι...</h3>
                        <p className="lg:w-80 lg:px-0 px-4 text-base leading-6 text-center text-white mt-6">Η δίψα για τα μαθηματικά και ο ενθουσιασμός, μας ώθησε να δημιουργήσει ένα μέρος που οι μαθητές να έχουν προσβαση σε πληθώρα διδακτικού υλικου. </p>
                    </div>
                    <div className="lg:w-96 w-80">
                        <img src={konna} className="h-72 w-full object-cover object-center rounded-t-md" alt="Konstantina Kirtsia" />
                        <div className="bg-white shadow-md rounded-md py-4 text-center">
                            <p className="text-base font-medium leading-6 text-gray-600">Κωνσταντίνα Κυρτσιά</p>
                            <p className="text-base leading-6 mt-2 text-gray-800"> Software Developer</p>
                        </div>
                    </div>
                    
                </div>
            </div>
        </>
    );
}


export default  AboutUsHoc;