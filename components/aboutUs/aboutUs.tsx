// 1. να βάλλω quotes
// 2. να βάλλω link

import greg from "../../app/assets/greg.jpg";

const AboutUsHoc = () => {
  return (
    <>
      <div className="mx-8 px-6 py-20 my-32">
        <h1 className="text-5xl font-black  leading-10 text-gray-800 text-center">
          Σχετικά με εμάς
        </h1>
        <div className="flex flex-wrap items-stretch  mt-16 xl:gap-[4.4rem] gap-4">
          <div className="lg:w-96 w-80">
            <img
              src={greg}
              className="h-72 w-full object-cover object-center rounded-t-md"
              alt="woman smiling"
            />
            <div className="bg-white shadow-md rounded-md py-4 text-center">
              <p className="text-base font-medium leading-6 text-gray-600">
                Γρηγόρης Κυρτσιάς
              </p>
              <p className="text-base leading-6 mt-2 text-gray-800">
                Μαθηματικός
              </p>
            </div>
          </div>
          <div className="bg-orange-600 rounded-md  lg:w-6/12 w-80 flex flex-col items-center justify-center md:py-0 py-12">
            <h3 className="text-2xl font-semibold leading-6 text-center text-white">
              Έστω ότι μαθηματικός με μουστάκι...
            </h3>
            <p className="lg:w-80 lg:px-0 px-4 text-base leading-6 text-center text-white mt-6">
              Η δίψα για τα μαθηματικά και ο ενθουσιασμός, μας ώθησε να
              δημιουργήσει ένα μέρος που οι μαθητές να έχουν προσβαση σε πληθώρα
              διδακτικού υλικου.{" "}
            </p>
            <a
              href="/aboutUs"
              className="inline-flex items-center font-medium text-white hover:underline mt-10"
            >
              Διάβασε περισότερα εδώ
              <svg
                aria-hidden="true"
                className="w-5 h-5 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutUsHoc;
