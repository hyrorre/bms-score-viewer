import { Setter, createSignal, type Component } from 'solid-js'

const Toggle: Component<{ text: string; setValue: Setter<boolean> }> = (props) => {
  const [value, setValue] = createSignal(false)
  const toggleValue = () => {
    setValue(!value())
    props.setValue((prev: boolean) => !prev)
  }

  return (
    <>
      <label class="inline-flex items-center me-5 cursor-pointer">
        <input type="checkbox" value="" checked={value()} class="sr-only peer" onClick={toggleValue} />
        <div class="relative w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
        <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{props.text}</span>
      </label>
    </>
  )
}

export default Toggle
