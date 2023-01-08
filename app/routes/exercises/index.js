import SearchInput from "../../../components/search/searchInput";
import Card from "../../../components/card/card";
const Exersices = () => {
  return (
    <div className="w-full" style={{ height: "inherit" }}>
      <h1 className="text-2xl m-10">Ασκήσεις</h1>
      <div className="flex justify-center items-center flex-col">
        <SearchInput />
      </div>
      <div className="flex flex-wrap gap-3">
        <Card />
      </div>
    </div>
  );
};

export default Exersices;
