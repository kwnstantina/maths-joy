import SearchInput from "../../../components/search/searchInput";
import Card from "../../../components/card/card";

const Exersices = () => {

  return (
    <div className="w-full" style={{ height: "inherit" }}>
      <SearchInput />
      <div className="flex flex-wrap gap-3">
        <Card />
      </div>
    </div>
  );
};

export default Exersices;
