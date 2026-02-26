interface ButtonProps {
  disabled: boolean;
  handleButton: () => void;
  name: string;
}

const Button = ({ name, handleButton, disabled }: ButtonProps) => {
  return (
    <button
      type="submit"
      className="
                px-4 py-2 mx-2 rounded-md
                bg-blue-600 text-white
                hover:bg-blue-700
                transition
                disabled:bg-gray-400
                disabled:cursor-not-allowed
                disabled:opacity-70
            "
      onClick={handleButton}
      disabled={disabled}
    >
      {name}
    </button>
  );
};

export default Button;
