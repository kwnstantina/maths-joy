import { Fragment, useEffect, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/solid'

type Props={
  categories:Array<any>
  onCallbackFunction:()=>void,
  isMultiple?:boolean,
  name?:string |undefined,
  required?:boolean
  placeholder?:string;
  value?:any;
}

const List=(props:Props):JSX.Element=> {
  const {categories,onCallbackFunction,isMultiple=false,name,required,placeholder,value}=props;
  return (
    <div className='mt-2'>
      <Listbox value={value} onChange={onCallbackFunction} multiple={isMultiple}>
        <div className="relative mt-1 bg-gray-50 border border-gray-300 text-left text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 ">
          <Listbox.Button
          className={'relative w-full  text-left'}
           >
              {/* {isMultiple? <span>
            {selected.map((category: { name: string }) => category.name).join(', ')}
            </span>:<span className="block truncate">{selected.name}</span>
            }  */}
            {value?<span aria-required={required} className="block truncate">{value}</span> : <span className="block truncate text-gray-400">{placeholder}</span>}
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
             className="absolute z-50 mt-1 max-h-60 w-[100%] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
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
                  disabled={category.unavailable}
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