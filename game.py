import pygame
import random

pygame.init()

# Screen
WIDTH, HEIGHT = 400, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Car Racing Game")

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

clock = pygame.time.Clock()

# Load Images
player_car = pygame.image.load("mercedes.png")
enemy_car = pygame.image.load("bmw.png")
road_car = pygame.image.load("audi.png")   # Decorative car

# Resize Images
player_car = pygame.transform.scale(player_car, (50, 90))
enemy_car = pygame.transform.scale(enemy_car, (50, 90))
road_car = pygame.transform.scale(road_car, (50, 90))

# Player
player_x = WIDTH // 2 - 25
player_y = HEIGHT - 110
player_speed = 6

# Enemy
enemy_x = random.randint(0, WIDTH - 50)
enemy_y = -100
enemy_speed = 5

# Audi Decorative Car
audi_x = 20
audi_y = 200

score = 0
font = pygame.font.SysFont(None, 35)

running = True

while running:
    screen.fill(WHITE)

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()

    if keys[pygame.K_LEFT] and player_x > 0:
        player_x -= player_speed

    if keys[pygame.K_RIGHT] and player_x < WIDTH - 50:
        player_x += player_speed

    # Move enemy
    enemy_y += enemy_speed

    if enemy_y > HEIGHT:
        enemy_y = -100
        enemy_x = random.randint(0, WIDTH - 50)
        score += 1
        enemy_speed += 0.2

    # Collision
    player_rect = pygame.Rect(player_x, player_y, 50, 90)
    enemy_rect = pygame.Rect(enemy_x, enemy_y, 50, 90)

    if player_rect.colliderect(enemy_rect):
        running = False

    # Draw Cars
    screen.blit(player_car, (player_x, player_y))
    screen.blit(enemy_car, (enemy_x, enemy_y))
    screen.blit(road_car, (audi_x, audi_y))

    # Score
    score_text = font.render(f"Score: {score}", True, BLACK)
    screen.blit(score_text, (10, 10))

    pygame.display.update()
    clock.tick(60)

pygame.quit()
