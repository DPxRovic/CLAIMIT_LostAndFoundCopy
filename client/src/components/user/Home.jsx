import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import ItemCard from './browseitems/ItemCard.jsx';
import { DEFAULT_BROWSE_ITEMS } from './browseitems/BrowseItems.jsx';
import { BrowseItemDetailsModal } from './browseitems/BrowseItemDetailsModal.jsx';
import { BrowseItemActionModal } from './browseitems/BrowseItemActionModal.jsx';
import { BrowseItemSuccessModal } from './browseitems/BrowseItemSuccessModal.jsx';

const DEFAULT_RECENTLY_REPORTED = [
  {
    id: 'airpods-pro-2',
    title: 'Apple AirPods Pro (2nd Gen)',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Active',
    date: 'Sept 09, 2026',
    location: 'Congress Campus - Library',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBC_O6MmcQqb46ZGcyzeTfXUwjVOrcA7pt-7KkZ4WHcZdRPV7BZmYaaYd6mtsib7Sc6PZVjQGxu46ep5UehnPK10IavovbjmraJxe04mEOIPuQmCE6uPsEjssyArCGewkghdRPgbVII2ykI6a_n-9lkrEE458d3HGJAYOwGIOtU_Stv4dDE5uLL3YiKWreMnUdg1N5-VsDRVQPLfWys_sSuTWOJE7hyn7CaBvbVjRoC1oS9ZdKzcIJSUQ',
    imageAlt:
      'Apple AirPods Pro second generation with case resting on cloth surface.',
  },
  {
    id: 'hydro-flask-32oz',
    title: 'Hydro Flask 32oz Navy',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 24, 2025',
    location: 'Science Hall 104',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6tWbpguWrLQHmnQ5US7mPJsyaDaf1i1EtLNKM3N4SjSDL3GLeAwfJpAysAbXwT298AAVjM2m92xTZLqKMma1MaheYWENk6gglSc7ijOOAUY-CpIzLOk8NTedsZf2NX86uhT8oxy3k-Ar1RGkKAm53vMmMzRFNogKRF36lolbxkc8r4yKOkyHKeBvsvI0F73tb1EZTitfZPqBU57cGYthS87ANF3LRCHEsYKW2HZFk6zd_PQiX1-8g8w',
    imageAlt:
      'Hydro Flask bottle next to climbing rope and carabiners outdoors.',
  },
  {
    id: 'keys-campus-lanyard',
    title: 'Keys with Red Campus Lanyard',
    category: 'KEYS & ACCESSORIES',
    type: 'FOUND',
    status: 'Active',
    date: 'Oct 24, 2025',
    location: 'Rec Center Lockers',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2pQgqAU8FBvHs78Vmf5dmzkB1BAGM-MYGXLH2Hgt_DbzhwdKIzHbTr6f7BYypkR0gI56j_BNeU6LD74vor4EwrCWRhCGz3H9ZgQaJJ-2AciSYE1zJhQSGezfdvwEPfPfuJO8ps7hCtTp7aBVZRDF0hECAP1gV9m1ix5yg76FBcegCvp84ANyJmitk0vtyakOAnvCmaGJHGFZzq1CIANoTkyl-0NPjmOeoPEGzMXV0uZnXX9osJDFnNw',
    imageAlt:
      'Keys attached to red campus strap and fob.',
  },
  {
    id: 'calculus-textbook-9th',
    title: 'Calculus: Early Transcendentals 9th Ed',
    category: 'BOOKS & STUDY MATERIAL',
    type: 'LOST',
    status: 'Active',
    date: 'Oct 23, 2025',
    location: 'Math & Science Bldg',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAd-Q3IfZLJhrRk6SOdTvaKWt6ivPBXqkdK-2Ta6b2L0nuRL4JklkwR8Lu391niFdb2tAv4M7qemA5EiICfGNJ0bDgxqhpoYZ8QcLQNLsoiD862lol907_uXvKMQwz5o4FptAd01exC7K2j8wJj2ocJVYgvGDtQftNHARCy3MzR4fNQtnQbbeXNYet6UpxdBv_4i9bZ6jOwEPBL3rEo9cMZzawOwoUsJZCzqAxRHmDfAXaqN4gLux79_g',
    imageAlt:
      'Calculus Early Transcendentals hardcover textbook on a desk.',
  },
];

const DEFAULT_RECENTLY_RESOLVED = [
  {
    id: 'sony-wh1000xm5',
    title: 'Sony WH-1000XM5 Headphones',
    category: 'ELECTRONICS',
    type: 'LOST',
    status: 'Resolved',
    date: 'Oct 23, 2025',
    location: 'Library 3rd Floor',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCAULVMR8fNlyLIUxx6WBrHNN37i0AAoEgfKDzyZ4HzdND1KTUJQLMYemtvoTxX_D_AwQirC6i782wPmpEbP23267Tmy2QNS6eBkt6iu8algEnZ7DFuod_5fMMdWkBDMpkKiImiaKgmW0pJmr7WyHb9Rq_1aW0Q9bYrON4oqYm5j-U8Oq7XBGSEDV-GhjLBdIKE9NSmdaq2wUU5JuHWdKzYcZNP5qccx39s42-2tuw9i8nRHOchGui4bA',
    imageAlt:
      'Black Sony wireless headphones resting comfortably.',
  },
  {
    id: 'black-leather-wallet',
    title: 'Black Leather Bifold Wallet',
    category: 'PERSONAL ITEMS',
    type: 'FOUND',
    status: 'Resolved',
    date: 'Oct 22, 2025',
    location: 'Library Front Desk',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCERDryOxxsewZHFZ_peWEfmLuoB7SbV9hy38LnUH474HsCCoEuZ9ZDjve1FiMPevRhRTK7ahcTnnv4IsidvjPNcYBUZZZo5dM8E7mdJow1mWJELVDrnJqf1ZT4Dv_xxlFWGYZlN18DOyhSS0JHxgONQcm4R2auBx8PCf5GiSthmZbISrgkx3SRnbv4S6mMRexNIX4pAINlXOODJRmeIiOOJB1TXfjZ8NCRe2Escodacliycd7CDSlLNQ',
    imageAlt:
      'Black grain leather bifold wallet on a table surface.',
  },
  {
    id: 'north-face-jacket',
    title: 'North Face Resolve Rain Jacket',
    category: 'APPAREL & BAGS',
    type: 'LOST',
    status: 'Resolved',
    date: 'Oct 21, 2025',
    location: 'Student Union Info Desk',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBRW-pbjHLqbjbsOXuj2JlZ34t2e5cnXaNiUSjMOV7BWQQ2i7zX3WNyd_LpVsstX0_UDd0nRzbSX1nXEPqSW4LeiV0TDpCKDaLdSUhdPdP6bmCG2MoVCuEulSSVPhjllFvMiK6s97F9lGz4nkZHvd8GdLuttc_e8IW1bataFbBGA-8VchgG9jnmRZiXsjzo9tMnjF3WKEbR1odgkWhhIIWpKb7CdsTvu2rTGWHNFtgfQJtcH3xNv_EvwA',
    imageAlt:
      'Waterproof hooded rain jacket folded with brand logo.',
  },
  {
    id: 'hp-laptop-charger',
    title: 'HP 65W USB-C Laptop Charger',
    category: 'ELECTRONICS',
    type: 'FOUND',
    status: 'Resolved',
    date: 'Oct 20, 2025',
    location: 'Engineering Hall 204',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCeousHM6qo8qNrC8f44Uo50n7WOJKJsBqKrMGzOJ_n4abz4dUg5knGGDNKCgM7FiT38jekNjbYF62J1XfOmRCw1FkJbHnFu7-J5P6pIJndaXR_GoFpAODhfWAVVUCwqBN0oReOS9hrQ7g3Zsq2Hv4qRbIzJCIu7EkliaKGSy_loIq1acZppOEr8F3qXQrxnshh32Zk2aKrtUoOlkISpm3WfqzoxX0sx7gJ-QMJmohAiwGs6Fcs4Yj9Fg',
    imageAlt:
      'Black laptop power adapter charger with cable.',
  },
];

/**
 * @param {Object} [props]
 * @param {Array} [props.recentlyReported]
 * @param {Array} [props.recentlyResolved]
 * @param {(() => void)} [props.onBrowseAllClick]
 * @param {((item: any) => void)} [props.onItemClick]
 * @param {(() => void)} [props.onNavigateToClaims]
 * @param {string} [props.className]
 */
export const Home = ({
  recentlyReported = DEFAULT_RECENTLY_REPORTED,
  recentlyResolved = DEFAULT_RECENTLY_RESOLVED,
  onBrowseAllClick,
  onItemClick,
  onNavigateToClaims,
  className = '',
}) => {
  // Modal state (same flow as BrowseItems)
  const [activeItemDetails, setActiveItemDetails] = useState(null);
  const [actionModalConfig, setActionModalConfig] = useState(null); // { item, mode: 'claim' | 'found_report' }
  const [successData, setSuccessData] = useState(null); // after submitting (same popup as Browse Items)

  // The Home cards only carry basic fields. The modals also need postedBy,
  // description and reportedTime, so fill those in from the Browse Items data.
  const browseLookup = useMemo(
    () => Object.fromEntries(DEFAULT_BROWSE_ITEMS.map((i) => [i.id, i])),
    []
  );

  const handleCardClick = (item) => {
    onItemClick?.(item);
    setActiveItemDetails({ ...browseLookup[item.id], ...item });
  };

  // Switch from details modal to action modal (Claim or Found Report)
  const handleOpenAction = (item, actionType) => {
    setActiveItemDetails(null);
    setActionModalConfig({ item, mode: actionType });
  };

  // ← in the action form: back to the item details
  const handleBackToDetails = () => {
    const item = actionModalConfig?.item;
    setActionModalConfig(null);
    if (item) setActiveItemDetails(item);
  };

  // Submit action modal -> success popup (same as Browse Items)
  const handleActionSuccess = (submissionData) => {
    setActionModalConfig(null);
    setSuccessData(submissionData);
  };

  return (
    <div className={`flex flex-col gap-8 w-full ${className}`}>
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-xl bg-white border border-[#E8E4D8] p-6 sm:p-8 md:p-10 shadow-sm flex flex-col justify-center">
        {/* Subtle geometric accents */}
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#5170ff]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute right-12 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#F3F4F6]/80 blur-2xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 opacity-[0.035] pointer-events-none hidden md:block"
          style={{
            backgroundImage: 'radial-gradient(#3b3b3b 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-3xl flex flex-col gap-2">
          <h1 className="text-[26px] sm:text-[30px] leading-tight text-[#23261F] font-bold tracking-tight">
            Lost something? Found something?{' '}
            <span className="text-[#5170ff]">
              Let&apos;s get it back where it belongs.
            </span>
          </h1>
          <p className="text-[15px] text-[#6E6858] max-w-2xl leading-relaxed mt-1">
            ClaimIt is your campus lost and found — report an item, browse what&apos;s turned up, and claim what&apos;s
            yours.
          </p>
        </div>
      </section>

      {/* Section 1: Recently Reported */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-xl text-[#23261F] font-bold tracking-tight">Recently Reported</h2>
            <a
              href="#browse-items"
              data-path="browse-items"
              onClick={(e) => {
                if (onBrowseAllClick) {
                  e.preventDefault();
                  onBrowseAllClick();
                }
              }}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#5170ff] hover:underline transition-colors duration-200"
            >
              <span>See all in Browse Items</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </a>
          </div>
          <p className="text-sm text-[#6E6858]">
            Latest lost and found items submitted by students and staff across campus.
          </p>
        </div>

        {/* 4 Item Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentlyReported.map((item) => (
            <ItemCard key={item.id} item={item} onClick={handleCardClick} />
          ))}
        </div>
      </section>

      {/* Section 2: Recently Resolved */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl text-[#23261F] font-bold tracking-tight">Recently Resolved</h2>
          <p className="text-sm text-[#6E6858]">
            Items successfully verified and reunited with their campus owners.
          </p>
        </div>

        {/* 4 Item Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentlyResolved.map((item) => (
            <ItemCard key={item.id} item={item} onClick={handleCardClick} />
          ))}
        </div>
      </section>

      {/* Item Details Modal */}
      {activeItemDetails && (
        <BrowseItemDetailsModal
          isOpen={Boolean(activeItemDetails)}
          item={activeItemDetails}
          onClose={() => setActiveItemDetails(null)}
          onOpenAction={handleOpenAction}
        />
      )}

      {/* Action Form Modal (Claim / Found Report) */}
      {actionModalConfig && (
        <BrowseItemActionModal
          isOpen={Boolean(actionModalConfig)}
          item={actionModalConfig.item}
          mode={actionModalConfig.mode}
          onClose={() => setActionModalConfig(null)}
          onBack={handleBackToDetails}
          onSubmitSuccess={handleActionSuccess}
        />
      )}

      {/* Success popup after submitting (same as Browse Items) */}
      <BrowseItemSuccessModal
        isOpen={Boolean(successData)}
        data={successData}
        onClose={() => setSuccessData(null)}
        onNavigateToClaims={onNavigateToClaims}
      />
    </div>
  );
};

export default Home;