import { useCallback, useState, useEffect } from 'react'
import './App.css'
import { getWishlistItems, deleteWishListItem } from './api/wishlistItems'
import {Card, DropDown, PaginationButtons, UserSearch} from './components/index'
import type { WishlistItemType, MetaDataType } from './types/wishlist'

const DEFAULT_LIMIT = 10

function App() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [wishlistItems, setWishlistItems] = useState<WishlistItemType[]>([])
  const [inputUserName, setInputUserName] = useState<string>("");
  const [searchUserName, setSearchUserName] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [meta, setMeta] = useState<MetaDataType>()
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getWishlistItems(currentPage, limit)
      setWishlistItems(res.data)
      setMeta(res.meta)
    } catch (err) {
      console.error(err)
      setError('Failed to load wishlist items')
    } finally {
      setLoading(false)
    }
  }, [currentPage, limit])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const handleBackPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((p) => p + 1)
  }

  const onDeleteItem = async (id: number) =>{
    await deleteWishListItem(id)
    await fetchData()
  }
  
  const handleSearchSubmit = () => {
    setSearchUserName(inputUserName.trim());
    console.log(`eventually searching for: ${searchUserName}`)
  }; 
  return (
    <>
      <div className="min-h-screen flex flex-col items-center py-16 px-4">
        <h1 className="text-5xl font-light text-gray-200 mb-12">
          Wishlists
        </h1>
        <h2>{loading && "loading..."}</h2>
        {error ? (<div><h2>{error}</h2></div>)
          : (<div className="flex flex-col items-center">
              <UserSearch onSubmit={handleSearchSubmit} value={inputUserName} onChange={setInputUserName}/>
              <div className="w-full max-w-md space-y-6">
                {wishlistItems.map((item: WishlistItemType) => (
                  <Card {...item} key={item.id} onDelete={onDeleteItem}/>
                ))}
              </div>
              <PaginationButtons handleBackPage={handleBackPage} handleNextPage={handleNextPage} currentPage={currentPage} totalPages={meta?.totalPages} />
              <DropDown limit={limit} setLimit={setLimit} setCurrentPage={setCurrentPage} totalItems={meta?.total} />
          </div>)}

      </div>   
    </>
  )
}

export default App
