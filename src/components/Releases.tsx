import MeshtasticIcon from './MeshtasticIcon';

const releases = [
  {
    id: 1,
    content: '2.5.5.e182ae7',
    href: '#',
    date: 'Sep 20',
    datetime: '2020-09-20',
    type: 'alpha',
    icon: MeshtasticIcon,
  },
  {
    id: 2,
    content: '2.5.3.a70d5ee',
    href: '#',
    date: 'Sep 22',
    datetime: '2020-09-22',
    type: 'alpha',
    icon: MeshtasticIcon,
  },
  {
    id: 3,
    content: '2.5.2.771cb52',
    href: '#',
    date: 'Sep 28',
    datetime: '2020-09-28',
    type: 'alpha',
    icon: MeshtasticIcon,
  },
  {
    id: 4,
    content: '2.5.4.8d288d5',
    href: '#',
    date: 'Sep 30',
    datetime: '2020-09-30',
    type: 'beta',
    icon: MeshtasticIcon,
  },
  {
    id: 5,
    content: '2.4.2.5b45303',
    href: '#',
    date: 'Oct 4',
    datetime: '2020-10-04',
    type: 'beta',
    icon: MeshtasticIcon,
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Releases() {
  return (
    <div className="flow-root">
      <div className="border-b border-gray-200 py-2">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Releases</h3>
      </div>
      <ul className="-mb-8">
        {releases.map((item, itemIdx) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {itemIdx !== releases.length - 1 ? (
                <span aria-hidden="true" className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />
              ) : null}
              <div className="relative flex space-x-3">
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
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    <time dateTime={item.datetime}>{item.date}</time>
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
