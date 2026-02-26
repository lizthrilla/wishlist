
import Button from './Button'

export interface PaginationButtonsProps {
    handleBackPage: () => void
    handleNextPage: () => void
    currentPage: number
    totalPages?: number | undefined
}

const PaginationButtons = ({handleBackPage, handleNextPage, currentPage, totalPages}: PaginationButtonsProps) => {
    const disabledBack = currentPage <= 1
    const disabledNext = totalPages !== undefined && currentPage >= totalPages


    return (
        <div className="flex flex-row items-center py-2">
          <Button name="Back" handleButton={handleBackPage} disabled={disabledBack}/>
          <h3>Page {currentPage}</h3>
          <Button name="Next" handleButton={handleNextPage} disabled={disabledNext}/>
        </div>
    )
}

export default PaginationButtons