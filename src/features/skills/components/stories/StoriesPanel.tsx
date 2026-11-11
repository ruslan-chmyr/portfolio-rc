import { useMemo } from 'react'
import {
  engineeringStories,
  getStoryCarouselItems,
  type EngineeringStory,
  type EngineeringStoryId,
} from '../../model/storiesConfig'
import { CircularCarousel, type CircularCarouselItem } from './CircularCarousel'
import { StoryDetail } from './StoryDetail'
import './stories.css'

type StoriesPanelProps = {
  focusedStory: EngineeringStory | null
  paused: boolean
  reducedMotion: boolean
  onOpenStory: (storyId: EngineeringStoryId) => void
  onCloseStory: () => void
}

export function StoriesPanel({
  focusedStory,
  paused,
  reducedMotion,
  onOpenStory,
  onCloseStory,
}: StoriesPanelProps) {
  const items = useMemo(() => getStoryCarouselItems(), [])

  const handleItemClick = (item: CircularCarouselItem) => {
    const match =
      (item.id && engineeringStories.find((story) => story.id === item.id)) ||
      engineeringStories.find((story) => story.title === item.title)
    if (match) onOpenStory(match.id)
  }

  return (
    <aside
      className={[
        'skills-section__stories-panel',
        focusedStory ? 'skills-section__stories-panel--focus' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-skills-stories-slot
      aria-label="Engineering stories"
    >
      <header className="skills-stories__header">
        <p className="skills-stories__eyebrow">Engineering Stories</p>
        <h3 className="skills-stories__title">
          {focusedStory ? 'Story Focus' : 'Selected challenges'}
        </h3>
      </header>

      <div
        className={[
          'skills-stories__stage',
          focusedStory ? 'skills-stories__stage--hidden' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden={Boolean(focusedStory)}
      >
        <CircularCarousel
          items={items}
          preset="cylinder"
          intro={reducedMotion ? 'none' : 'rise'}
          autoplay={reducedMotion ? 'off' : 'drift'}
          speed={10}
          cardWidth={210}
          aspectRatio={0.72}
          gap={28}
          captions
          pauseOnHover
          focusOnClick
          paused={paused || Boolean(focusedStory)}
          fadeColor="#05070f"
          innerShade={0.35}
          cornerRadius={16}
          depthFade={0.62}
          parallax={reducedMotion ? 0 : 0.22}
          stretch={reducedMotion ? 0 : 0.35}
          ariaLabel="Engineering stories carousel"
          onItemClick={handleItemClick}
        />
      </div>

      {focusedStory ? (
        <div className="skills-stories__detail-slot">
          <StoryDetail story={focusedStory} onClose={onCloseStory} />
        </div>
      ) : null}
    </aside>
  )
}
