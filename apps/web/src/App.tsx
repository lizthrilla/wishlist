import { useState, useEffect } from 'react'
import './App.css'
import { getWishlistItems } from './api/wishlistItems'
import Card from '../src/components/Card'
import UserSearch from './components/UserSearch'
import type { WishlistItemType } from './types/wishlist'

function App() {
  const [count, setCount] = useState(0)
  const [wishlistItems, setWishlistItems] = useState<WishlistItemType[]>([])
  const [inputUserName, setInputUserName] = useState("");
  const [searchUserName, setSearchUserName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const data = await getWishlistItems(1, 10)
      setWishlistItems(data.data)
    }
    fetchData()
  }, [])

  const handleSearchSubmit = () => {
    setSearchUserName(inputUserName.trim());
    console.log(`eventually searching for: ${searchUserName}`)
  };

  const onDeleteItem = (id: number) =>{
    console.log(id)
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center py-16 px-4">
        <h1 className="text-5xl font-light text-gray-200 mb-12">
          Wishlists
        </h1>

        <UserSearch onSubmit={handleSearchSubmit} value={inputUserName} onChange={setInputUserName}/>

        <div className="w-full max-w-md space-y-6">
          {wishlistItems.map((item: WishlistItemType) => (
            <Card {...item} key={item.id} onDelete={onDeleteItem}/>
          ))}
        </div>

      </div>   
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
