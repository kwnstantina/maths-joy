import { MathJaxContext, MathJax } from "better-react-mathjax";
const TestYourself = () => {
  const config = {
    loader: { load: ["input/asciimath"] },
    asciimath: {
      displaystyle: true,
      delimiters: [
        ["$", "$"],
        ["`", "`"]
      ]
    }
  };
  return (
    <MathJaxContext config={config}>
      <div className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex-col gap-4">
            <div>
            <MathJax
            renderMode={"pre"}
            typesettingOptions={{ fn: "asciimath2chtml" }}
            text={'ln(x+sqrt (x^2+1))'}
            inline
            dynamic
            />
            </div>
            <div>
            <button className="w-30 h-30 text-center rounded bg-orange-500  py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400">
            Λύση
            </button>
            </div>
            <p>ΛΎΣΗ ΕΔΩ</p>
          </div>
        
        </div>
      </div>
    </MathJaxContext>
  );
};

export default TestYourself;
