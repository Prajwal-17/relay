import { useEffect, useState } from "react";

const SearchDropdownImages = (idx: string) => {
  const [searchParams, setSearchParams] = useState<string>("");
  const [searchRow, setSearchRow] = useState<number>();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    console.log(searchParams, setSearchParams, setSearchRow, setIsDropdownOpen)
  }, [])

  return (
    <>
      <div>Search Dropdown with Images</div>
      {/* @ts-ignore */}
      {isDropdownOpen && searchRow === idx && (
        <div className="absolute inset-x-0 z-10 ml-24 h-[500px] rounded-xl bg-[#d0d5db]">
          <div className="flex h-full w-full flex-wrap overflow-auto px-5 py-4">
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
            <div className="border-border h-56 w-52 border bg-gray-900 px-2 text-white">
              Card
              <div className="h-20 w-full bg-blue-400 px-2"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchDropdownImages;
