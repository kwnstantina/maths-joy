import "react-cmdk/dist/cmdk.css";
import CommandPalette, { filterItems, getItemIndex } from "react-cmdk";
import { useNavigate } from "react-router-dom";

import { useState } from "react";
type Props={
  isOpenKbar:boolean;
  onCloseKbar: () => any;
  data:any;
}
const Kbar = (props:Props) => {
  const {isOpenKbar,onCloseKbar,data}=props;
  //move logic to parent commpenent
  const [page, setPage] = useState<"root" | "projects">("projects");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const filteredItems = filterItems(
    [
      {
        heading: "Ασκήσεις",
        id: "exercises",
        items: [
          ...data,
        ],
      },
      {
        heading: "Aλλα",
        id: "advanced",
        items: [
          {
            id: "privacy-policy",
            children: "Privacy policy",
    
            href: "#",
          },
          {
            id: "log-out",
            children: "Log out",
    
            onClick: () => {
              navigate("/logout");
            },
          },
        ],
      },
    ],
    search
  );

  return (
    
    <CommandPalette
      onChangeSearch={setSearch}
      onChangeOpen={onCloseKbar}
      search={search}
      isOpen={isOpenKbar}
      page={page}
    >
      <CommandPalette.Page id="projects">
        {filteredItems.length ? (
          filteredItems.map((list) => (
            <CommandPalette.List key={list.id} heading={list.heading}>
              {list.items.map(({ id, ...rest }) => (
                <CommandPalette.ListItem
                  key={id}
                  index={getItemIndex(filteredItems, id)}
                  {...rest}
                />
              ))}
            </CommandPalette.List>
          ))
        ) : (
          <CommandPalette.FreeSearchAction />
        )}
      </CommandPalette.Page>

      <CommandPalette.Page id="projects">
        {/* Projects page */}
      </CommandPalette.Page>
    </CommandPalette>
  );
};

export default Kbar;