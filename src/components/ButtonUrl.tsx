import type { Component } from 'solid-js'
import share from '../assets/share.svg'

const ButtonUrl: Component<{ href: string; text: string }> = (props) => {
  const openUrl = () => {
    window.open(props.href, '_blank')!.focus()
  }

  return (
    <button
      onClick={openUrl}
      class="px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
    >
      <img src={share} alt="Open" />
    </button>
  )
}

export default ButtonUrl
