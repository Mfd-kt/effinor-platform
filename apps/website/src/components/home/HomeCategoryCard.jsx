import React from 'react';
import { Link } from 'react-router-dom';

const HomeCategoryCard = ({ icon: Icon, title, description, to }) => {
  return (
    <Link
      to={to}
      className="group bg-white border border-gray-100 rounded-lg p-3 md:p-4 flex items-center gap-3 hover:border-secondary-500 hover:shadow-md transition-all"
    >
      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full bg-secondary-50 flex items-center justify-center group-hover:bg-secondary-100">
        {Icon ? (
          <Icon className="w-5 h-5 text-secondary-600" />
        ) : (
          <span className="text-secondary-600 text-sm font-semibold">LED</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-[11px] md:text-xs text-gray-600 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
};

export default HomeCategoryCard;















