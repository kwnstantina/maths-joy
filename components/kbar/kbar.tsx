import "react-cmdk/dist/cmdk.css";
import CommandPalette, { filterItems, getItemIndex } from "react-cmdk";
import { useEffect, useState } from "react";
type Props={
  isOpenKbar:boolean;
  onCloseKbar: () => any;
}
const Kbar = (props:Props) => {
  const {isOpenKbar,onCloseKbar}=props;
  //move logic to parent commpenent
  const [page, setPage] = useState<"root" | "projects">("projects");
  const [search, setSearch] = useState("");
  const filteredItems = filterItems(
    [
      {
        heading: "Home",
        id: "home",
        items: [
          {
            id: "home",
            children: "Home",
    
            href: "#",
          },
          {
            id: "settings",
            children: "Settings",
      
            href: "#",
          },
          {
            id: "projects",
            children: "Projects",
        
            closeOnSelect: false,
            onClick: () => {
              setPage("projects");
            },
          },
        ],
      },
      {
        heading: "Other",
        id: "advanced",
        items: [
          {
            id: "developer-settings",
            children: "Developer settings",
        
            href: "#",
          },
          {
            id: "privacy-policy",
            children: "Privacy policy",
    
            href: "#",
          },
          {
            id: "log-out",
            children: "Log out",
    
            onClick: () => {
              alert("Logging out...");
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