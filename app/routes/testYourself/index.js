import { MathJaxContext, MathJax } from "better-react-mathjax";
const TestYourself = () => {
  return (
    <MathJaxContext>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
            <h2>Basic MathJax example with Latex</h2>
            <MathJax>{"\\(\\frac{10}{4x} \\approx 2^{12}\\)"}</MathJax>
            <button className="w-30 h-30 text-center rounded bg-orange-500  py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400">
            Λύση
            </button>
            <p>ΛΎΣΗ ΕΔΩ</p>
          </div>
        
        </div>
      </div>
    </MathJaxContext>
  );
};

export default TestYourself;
