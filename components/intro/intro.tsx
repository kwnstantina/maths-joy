import greg from '../../app/assets/mathsNewMustash.png'

const Intro = () => {
  return (
    <div>
      <img
        src={greg}
        alt="Gregory Kirtsias"
        className="h-30 rounded-full md:max-w-4xl"
      />
      <h1 className="max-w-2xl mx-auto mb-10 text-3xl font-bold leading-normal  md:text-4xl">
        Ασκήσεις και θέματα μαθηματικών.
      </h1>
      <p className="max-w-sm mx-auto mb-10 text-sm md:max-w-xl md:text-lg">
        Στο GregKyrMaths θα βρεις ασκήσεις, θέματα, βιβλία και διδακτικό υλικό,
        για μαθητές όλων των εκπαιδευτικών βαθμίδων.
      </p>
      <a
        href="exercises"
        className="inline-flex items-center px-3 py-3 text-sm font-medium text-center text-white bg-orange-600 rounded-lg hover:bg-orange-800 focus:ring-4 focus:outline-none focus:ring-orange-300"
      >
        Ας ξεκινήσουμε
        <svg
          aria-hidden="true"
          className="w-4 h-4 ml-2 -mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
          ></path>
        </svg>
      </a>
    </div>
  );
};

export default Intro;
