// /components/multi-search.tsx
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, ExternalLink, Calendar, ImageIcon, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import PlaceholderImage from './placeholder-image';

type SearchImage = {
    url: string;
    description: string;
};

type SearchResult = {
    url: string;
    title: string;
    content: string;
    raw_content: string;
    published_date?: string;
};

type SearchQueryResult = {
    query: string;
    results: SearchResult[];
    images: SearchImage[];
};

type MultiSearchResponse = {
    searches: SearchQueryResult[];
};

type MultiSearchArgs = {
    queries: string[];
    maxResults: number[];
    topics: ("general" | "news")[];
    searchDepth: ("basic" | "advanced")[];
};

type QueryCompletion = {
    type: 'query_completion';
    data: {
        query: string;
        index: number;
        total: number;
        status: 'completed';
        resultsCount: number;
        imagesCount: number;
    };
};

const PREVIEW_IMAGE_COUNT = {
    MOBILE: 4,
    DESKTOP: 5
};

// Loading state component
const SearchLoadingState = ({ 
    queries,
    annotations 
}: { 
    queries: string[];
    annotations: QueryCompletion[];
}) => {
    const totalResults = annotations.reduce((sum, a) => sum + a.data.resultsCount, 0);

    return (
        <div className="w-full space-y-3">
            <Accordion type="single" collapsible defaultValue="search" className="w-full">
                <AccordionItem value="search" className="border-none">
                    <AccordionTrigger
                        className="py-3 px-4 bg-white dark:bg-neutral-900 rounded-lg hover:no-underline border border-neutral-200 dark:border-neutral-800 data-[state=open]:rounded-b-none"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
                                    <Globe className="h-3.5 w-3.5 text-neutral-500" />
                                </div>
                                <h2 className="font-medium text-left text-sm">Sources Found</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="secondary"
                                    className="rounded-full px-2.5 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800"
                                >
                                    <Search className="h-2.5 w-2.5 mr-1" />
                                    {totalResults || '0'} Results
                                </Badge>
                            </div>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-0 mt-0 border-0 overflow-hidden data-[state=open]:animate-[var(--animate-accordion-down)] data-[state=closed]:animate-[var(--animate-accordion-up)]">
                        <div className="py-3 px-4 bg-white dark:bg-neutral-900 rounded-b-lg border border-t-0 border-neutral-200 dark:border-neutral-800">
                            {/* Query badges */}
                            <div className="flex overflow-x-auto gap-1.5 mb-3 no-scrollbar pb-1">
                                {queries.map((query, i) => {
                                    const annotation = annotations.find(a => a.data.query === query);
                                    return (
                                        <Badge
                                            key={i}
                                            variant="secondary"
                                            className={cn(
                                                "px-2.5 py-1 text-xs rounded-full shrink-0 flex items-center gap-1.5",
                                                annotation 
                                                    ? "bg-neutral-100 dark:bg-neutral-800" 
                                                    : "bg-neutral-50 dark:bg-neutral-900 text-neutral-400"
                                            )}
                                        >
                                            {annotation ? (
                                                <Check className="h-2.5 w-2.5" />
                                            ) : (
                                                <div className="h-2.5 w-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                            )}
                                            {query}
                                        </Badge>
                                    );
                                })}
                            </div>

                            {/* Horizontal scrolling results skeleton */}
                            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1 snap-x snap-mandatory">
                                {[...Array(4)].map((_, i) => (
                                    <div 
                                        key={i}
                                        className="w-[280px] shrink-0 bg-background rounded-lg border border-border/50 snap-start"
                                    >
                                        <div className="p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="h-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse w-3/4" />
                                                    <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse w-1/2" />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 mb-2">
                                                <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse w-full" />
                                                <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse w-5/6" />
                                                <div className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-md animate-pulse w-4/6" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Images section skeleton */}
            <div className="grid gap-1.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "aspect-video rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse",
                            i === 0 && "sm:row-span-2 sm:col-span-2"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

const ResultCard = ({ result }: { result: SearchResult }) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);

    return (
        <div className="w-[280px] shrink-0 bg-background rounded-lg border border-border/50 transition-all">
            <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="relative w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                        {!imageLoaded && (
                            <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" />
                        )}
                        <Image
                            src={`https://www.google.com/s2/favicons?sz=128&domain=${new URL(result.url).hostname}`}
                            alt=""
                            className={cn(
                                "w-5 h-5 object-contain",
                                !imageLoaded && "opacity-0"
                            )}
                            width={100}
                            height={100}
                            onLoad={() => setImageLoaded(true)}
                            onError={(e) => {
                                setImageLoaded(true);
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='16'/%3E%3Cline x1='8' y1='12' x2='16' y2='12'/%3E%3C/svg%3E";
                            }}
                            unoptimized
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1">{result.title}</h3>
                        <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 truncate"
                        >
                            {new URL(result.url).hostname}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                    {result.content}
                </p>

                {result.published_date && (
                    <div className="pt-1 border-t border-border/50">
                        <time className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {new Date(result.published_date).toLocaleDateString()}
                        </time>
                    </div>
                )}
            </div>
        </div>
    );
};

interface ImageGridProps {
    images: SearchImage[];
    showAll?: boolean;
}

const ImageGrid = ({ images, showAll = false }: ImageGridProps) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedImage, setSelectedImage] = React.useState(0);
    const isMobile = useIsMobile();
    const [imageLoaded, setImageLoaded] = React.useState<Record<number, boolean>>({});
    const [imageError, setImageError] = React.useState<Record<number, boolean>>({});

    const displayImages = showAll 
        ? images 
        : images.slice(0, isMobile ? PREVIEW_IMAGE_COUNT.MOBILE : PREVIEW_IMAGE_COUNT.DESKTOP);
    const hasMore = images.length > (isMobile ? PREVIEW_IMAGE_COUNT.MOBILE : PREVIEW_IMAGE_COUNT.DESKTOP);

    const handleImageLoad = (index: number) => {
        setImageLoaded(prev => ({ ...prev, [index]: true }));
    };

    const handleImageError = (index: number) => {
        setImageError(prev => ({ ...prev, [index]: true }));
        setImageLoaded(prev => ({ ...prev, [index]: true })); // Set loaded to true to hide loading state
    };

    return (
        <div>
            <div className={cn(
                "grid gap-1.5",
                // Default mobile layout
                "grid-cols-2",
                displayImages.length === 1 && "grid-cols-1",
                // Responsive layouts
                "sm:grid-cols-3 md:grid-cols-4",
                // Aspect ratio for all images
                "*:aspect-video",
                // First image larger on tablet and up
                displayImages.length > 1 && "sm:[&>*:first-child]:row-span-2 sm:[&>*:first-child]:col-span-2",
                displayImages.length === 1 && "[&>*:first-child]:col-span-full"
            )}>
                {displayImages.map((image, index) => (
                    <motion.button
                        key={index}
                        className={cn(
                            "relative rounded-lg overflow-hidden group",
                            "focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-1",
                            "transition-all duration-200",
                            "bg-muted",
                            !imageLoaded[index] && "animate-pulse"
                        )}
                        onClick={() => {
                            setSelectedImage(index);
                            setIsOpen(true);
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        {(!imageLoaded[index] || imageError[index]) && (
                            <div className="absolute inset-0">
                                {imageError[index] ? (
                                    <PlaceholderImage variant="compact" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full">
                                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                                    </div>
                                )}
                            </div>
                        )}
                        {!imageError[index] && (
                            <Image
                                src={image.url}
                                alt={image.description || ""}
                                className={cn(
                                    "w-full h-full object-cover",
                                    "transition-all duration-300",
                                    "group-hover:scale-105",
                                    !imageLoaded[index] && "opacity-0"
                                )}
                                width={100}
                                height={100}
                                unoptimized
                                onLoad={() => handleImageLoad(index)}
                                onError={() => handleImageError(index)}
                            />
                        )}
                        {!imageError[index] && image.description && (
                            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 flex items-end">
                                <p className="text-xs text-white line-clamp-2 w-full">{image.description}</p>
                            </div>
                        )}
                        {!showAll && hasMore && index === displayImages.length - 1 && !imageError[index] && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Badge
                                    variant="secondary"
                                    className={cn(
                                        "rounded-full",
                                        "px-2.5 py-1",
                                        "bg-black/75 hover:bg-black/85",
                                        "backdrop-blur-[2px]",
                                        "border border-white/20",
                                        "transition-colors",
                                        "text-xs font-medium text-white"
                                    )}
                                >
                                    +{images.length - displayImages.length} more
                                </Badge>
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {!isMobile ? (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="max-w-4xl! w-[90vw]! h-[65vh]! p-0 overflow-hidden border-none shadow-xl [&>button]:hidden">
                        <div className="relative w-full h-full rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                            <div className="absolute top-0 left-0 right-0 z-50 p-2 flex justify-between items-center">
                                <Badge variant="secondary" className="rounded-full bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                    <span className="text-xs font-normal">
                                        {selectedImage + 1} of {images.length}
                                    </span>
                                </Badge>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-white/90 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center p-8 mt-[35px] mb-[35px]">
                                <AnimatePresence mode="wait">
                                    {imageError[selectedImage] ? (
                                        <motion.div
                                            key={`error-${selectedImage}`}
                                            className="w-full h-full flex items-center justify-center"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="w-full max-w-md h-64">
                                                <PlaceholderImage />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.img
                                            key={selectedImage}
                                            src={images[selectedImage].url}
                                            alt={images[selectedImage].description || ""}
                                            className="max-w-full max-h-full object-contain"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            onError={() => handleImageError(selectedImage)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            <Button
                                className={cn(
                                    "absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full",
                                    "bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700",
                                    "hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                                )}
                                onClick={() => {
                                    setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1);
                                }}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full",
                                    "bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700",
                                    "hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                                )}
                                onClick={() => {
                                    setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1);
                                }}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>

                            {images[selectedImage].description && !imageError[selectedImage] && (
                                <div className="absolute bottom-0 inset-x-0 p-2 bg-white/90 dark:bg-neutral-800/90 border-t border-neutral-200 dark:border-neutral-700">
                                    <p className="text-xs text-neutral-700 dark:text-neutral-300 max-w-[90%] mx-auto text-center">
                                        {images[selectedImage].description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer open={isOpen} onOpenChange={setIsOpen}>
                    <DrawerContent className="p-0 max-h-[80vh] h-[80vh] border-t border-neutral-200 dark:border-neutral-700 rounded-t-xl bg-white dark:bg-neutral-900">
                        <div className="relative w-full h-full overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 z-50 p-2 flex justify-between items-center">
                                <Badge variant="secondary" className="rounded-full bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                    <span className="text-xs font-normal">
                                        {selectedImage + 1} of {images.length}
                                    </span>
                                </Badge>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-white/90 dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center p-6 mt-[35px] mb-[35px]">
                                <AnimatePresence mode="wait">
                                    {imageError[selectedImage] ? (
                                        <motion.div
                                            key={`error-${selectedImage}`}
                                            className="w-full h-full flex items-center justify-center"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="w-full max-w-sm h-48">
                                                <PlaceholderImage />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.img
                                            key={selectedImage}
                                            src={images[selectedImage].url}
                                            alt={images[selectedImage].description || ""}
                                            className="max-w-full max-h-full object-contain"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            onError={() => handleImageError(selectedImage)}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            <Button
                                className={cn(
                                    "absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full",
                                    "bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700",
                                    "hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                                )}
                                onClick={() => {
                                    setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1);
                                }}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full",
                                    "bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700",
                                    "hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                                )}
                                onClick={() => {
                                    setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1);
                                }}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>

                            {images[selectedImage].description && !imageError[selectedImage] && (
                                <div className="absolute bottom-0 inset-x-0 p-2 bg-white/90 dark:bg-neutral-800/90 border-t border-neutral-200 dark:border-neutral-700">
                                    <p className="text-xs text-neutral-700 dark:text-neutral-300 max-w-[90%] mx-auto text-center">
                                        {images[selectedImage].description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
        </div>
    );
};

const MultiSearch: React.FC<{ 
    result: MultiSearchResponse | null; 
    args: MultiSearchArgs;
    annotations?: QueryCompletion[];
}> = ({
    result,
    args,
    annotations = []
}) => {
    if (!result) {
        return <SearchLoadingState queries={args.queries} annotations={annotations} />;
    }

    // Collect all images from all searches
    const allImages = result.searches.reduce<SearchImage[]>((acc, search) => {
        return [...acc, ...search.images];
    }, []);

    const totalResults = result.searches.reduce((sum, search) => sum + search.results.length, 0);

    return (
        <div className="w-full space-y-3">
            <Accordion type="single" collapsible defaultValue="search" className="w-full">
                <AccordionItem value="search" className="border-none">
                    <AccordionTrigger
                        className="py-3 px-4 bg-white dark:bg-neutral-900 rounded-lg hover:no-underline border border-neutral-200 dark:border-neutral-800 data-[state=open]:rounded-b-none"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800">
                                    <Globe className="h-3.5 w-3.5 text-neutral-500" />
                                </div>
                                <h2 className="font-medium text-left text-sm">Sources Found</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="secondary"
                                    className="rounded-full px-2.5 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800"
                                >
                                    <Search className="h-2.5 w-2.5 mr-1" />
                                    {totalResults} Results
                                </Badge>
                            </div>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="pt-0 mt-0 border-0 overflow-hidden data-[state=open]:animate-[var(--animate-accordion-down)] data-[state=closed]:animate-[var(--animate-accordion-up)]">
                        <div className="py-3 px-4 bg-white dark:bg-neutral-900 rounded-b-lg border border-t-0 border-neutral-200 dark:border-neutral-800">
                            {/* Query badges */}
                            <div className="flex overflow-x-auto gap-1.5 mb-3 no-scrollbar pb-1">
                                {result.searches.map((search, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="px-2.5 py-1 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 shrink-0"
                                    >
                                        <Search className="h-2.5 w-2.5 mr-1" />
                                        {search.query}
                                    </Badge>
                                ))}
                            </div>

                            {/* Horizontal scrolling results */}
                            <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1 snap-x snap-mandatory scroll-pl-4">
                                {result.searches.map(search =>
                                    search.results.map((result, resultIndex) => (
                                        <motion.div
                                            key={`${search.query}-${resultIndex}`}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: resultIndex * 0.05 }}
                                            className="snap-start"
                                        >
                                            <ResultCard result={result} />
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Images section outside accordion */}
            {allImages.length > 0 && <ImageGrid images={allImages} />}
        </div>
    );
};

export default MultiSearch;
