import { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/solid'

type Props={
  categories:Array<any>
  onCallbackFunction:Function,
  isMultiple?:boolean
  name?:string |undefined
}

const List=(props:Props):JSX.Element=> {
  const {categories,onCallbackFunction,isMultiple=false,name}=props;
  const [selected, setSelected] = useState(isMultiple?[categories[1]]:categories[1]);
  useEffect(()=>{
    onCallbackFunction(selected)
  },[onCallbackFunction,selected])

  return (
    <div className='mt-2'>
      <Listbox value={selected} onChange={setSelected} multiple={isMultiple} refName={name}>
        <div className="relative mt-1 ">
          <Listbox.Button className="relative w-94 cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
           {isMultiple? <span>
            {selected.map((category: { name: string }) => category.name).join(', ')}
            </span>:<span className="block truncate">{selected.name}</span>
            } 
          </Listbox.Button>
          <Listbox.Button>
       
      </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
             style={{zIndex:50}}
             className="absolute z-50 mt-1 max-h-60 w-44 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            >
              {categories.map((category,categoryIdx) => (
                <Listbox.Option
                  key={isMultiple?category.id:categoryIdx}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 z-50 ${
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                    }`
                  }
                  value={category}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {category?.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600 z-50" >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}


export default List;