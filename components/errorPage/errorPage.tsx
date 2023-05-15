import { Link } from "@remix-run/react";

const ErrorPage = () => {
  return (
    <div className="w-9/12 m-auto py-16 min-h-screen flex items-center justify-center">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg pb-8">
        <div className="border-t border-gray-200 text-center pt-8">
            <div className="flex items-center justify-center">
            <p className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-8xl font-black">
            4
          </p>
          <p className="bg-clip-text text-8xl font-black">
          😕
          </p>
          <p className="animate-text bg-gradient-to-r from-teal-500 via-purple-500 to-orange-500 bg-clip-text text-transparent text-8xl font-black">
            4
          </p>
            </div>
     
          <p className="text-xl pb-8 px-12 font-medium py-8" >
           Ουπς! Κάτι πήγε στραβά.
          </p>
          <p className="text-xl px-12 font-medium " >
           Η σελίδα που ζητήσατε δεν βρέθηκε.
          </p>
          <p className="text-base px-12 font-medium pb-8">
            Παρακαλούμε, επικοινωνήστε μαζί μας για να σας βοηθήσουμε.
          </p>
          <Link to={"/"}>
            <button className="bg-orange-400 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-md mr-6 mx-8">
              Πίσω στην αρχική
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
