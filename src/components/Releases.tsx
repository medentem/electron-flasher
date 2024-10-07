import MeshtasticIcon from './MeshtasticIcon';
import { FolderPlusIcon } from '@heroicons/react/24/solid';

const releases = [
  {
    id: 1,
    content: '2.5.5.e182ae7',
    href: '#',
    date: 'Sep 20',
    datetime: '2020-09-20',
    type: 'alpha',
    icon: MeshtasticIcon,
    selected: false,
    isLatest: false,
  },
  {
    id: 2,
    content: '2.5.3.a70d5ee',
    href: '#',
    date: 'Sep 22',
    datetime: '2020-09-22',
    type: 'alpha',
    icon: MeshtasticIcon,
    selected: false,
    isLatest: false,
  },
  {
    id: 3,
    content: '2.5.2.771cb52',
    href: '#',
    date: 'Sep 28',
    datetime: '2020-09-28',
    type: 'alpha',
    icon: MeshtasticIcon,
    selected: false,
    isLatest: false,
  },
  {
    id: 4,
    content: '2.5.4.8d288d5',
    href: '#',
    date: 'Sep 30',
    datetime: '2020-09-30',
    type: 'beta',
    icon: MeshtasticIcon,
    selected: true,
    isLatest: true,
  },
  {
    id: 5,
    content: '2.4.2.5b45303',
    href: '#',
    date: 'Oct 4',
    datetime: '2020-10-04',
    type: 'beta',
    icon: MeshtasticIcon,
    selected: false,
    isLatest: false,
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Releases() {
  return (
    <div className="flow-root">
      <div className="border-b border-gray-200 py-2">
          <div className="flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold leading-6 text-gray-900">Available Updates</h3>
            </div>
            <div className="min-w-0 flex 1">
              <FolderPlusIcon className='text-gray-500 size-6 cursor-pointer' />
            </div>
          </div>
      </div>
      <ul className="overflow-scroll">
        {releases.map((item, itemIdx) => (
          <li key={item.id}>
            <div className="relative">
              {itemIdx !== releases.length - 1 ? (
                <span aria-hidden="true" className="absolute left-8 top-4 -ml-px h-full w-0.5 bg-gray-200" />
              ) : null}
              <div className={`p-4 relative flex space-x-3 hover:bg-gray-200 ${item.selected ? 'border-2 border-meshtastic-green' : ''}`}>
                <div>
                  <span
                    className={classNames(
                        item.type == 'alpha' ? 'bg-orange-500' : 'bg-meshtastic-green',
                      'flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white',
                    )}
                  >
                    <item.icon aria-hidden="true" className="h-5 w-5 text-white" />
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-500">
                      {item.content}
                    </p>
                    <p className="text-xs italic text-gray-500">
                      {item.type === 'alpha' ? 'Pre-release' : 'Stable'}
                    </p>
                  </div>
                  <div className="flex flex-col whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={item.datetime}>{item.date}</time>
                      {item.isLatest &&
                      <span className="inline-flex items-center rounded-full bg-meshtastic-green px-2 py-0.5 text-xs font-medium text-gray-900">
                        Latest
                      </span>
                      }
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
