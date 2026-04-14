import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, User } from 'lucide-react';
import { surfaceCardVariants, CategoryBadge } from '@/components/ds';
import BlogImage from '@/components/blog/BlogImage';
import { cn } from '@/lib/utils';

const formatDate = (s) =>
  s
    ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

const BlogCard = ({ post, index = 0 }) => {
  if (!post?.slug) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className={cn(surfaceCardVariants({ variant: 'elevated' }), 'group flex flex-col')}
    >
      <Link to={`/blog/${post.slug}`} className="block flex-1 flex flex-col">
        {/* Cover */}
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          <BlogImage
            coverImage={post.coverImage}
            title={post.title}
            category={post.category}
            variant="card"
            imgClassName="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {post.category ? (
            <CategoryBadge category={post.category} className="absolute top-3 left-3" />
          ) : null}
        </div>

        {/* Body */}
        <div className="p-6 flex-1 flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-sm text-gray-500 line-clamp-3 flex-1">{post.excerpt}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.published_at)}
              </span>
            )}
            {post.reading_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.reading_time} min
              </span>
            )}
            {post.author && (
              <span className="flex items-center gap-1 ml-auto">
                <User className="h-3.5 w-3.5" />
                {post.author}
              </span>
            )}
          </div>

          {/* Read more */}
          <div className="flex items-center gap-1 text-primary-600 font-semibold text-sm mt-1">
            Lire l&apos;article
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
};

export default BlogCard;
