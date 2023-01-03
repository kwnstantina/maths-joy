import plot from "../assets/plot.png";

export default function Index() {
  return (
    <div className="flex justify-center">
      <img
        src={plot}
        alt="gregsPlot"
        className="w-5/12 h-30 rounded-full"
      ></img>
      <div className="mt-20 w-50">
        <p className="text-4xl">Ασκήσεις και θέματα μαθηματικών</p>
        <p className="text-lg px-4 text-gray-800">
          Ασκήσεις, θέματα, βιβλία και διδακτικό υλικό
        </p>
        <p className="text-lg px-4 text-gray-800">για μαθητές όλων των εκπαιδευτικών βαθμίδων</p>
        <a href="#" className="mt-5 inline-flex items-center px-3 py-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            Ας ξεκινήσουμε
            <svg aria-hidden="true" className="w-4 h-4 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20"
             xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"></path></svg>
        </a>
      </div>  
    </div>
  );
}
