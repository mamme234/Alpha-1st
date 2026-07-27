const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const { authenticate, isAdmin, isCreator, authenticateTelegram } = require('./auth');
const { validate } = require('./middleware');
const { upload } = require('./uploads');

// ===== AUTH ROUTES =====
router.post('/auth/telegram', authenticateTelegram, controllers.auth.login);
router.post('/auth/refresh', controllers.auth.refreshToken);
router.post('/auth/logout', authenticate, controllers.auth.logout);

// ===== USER ROUTES =====
router.get('/users/me', authenticate, controllers.user.getProfile);
router.put('/users/me', authenticate, controllers.user.updateProfile);
router.get('/users/:userId', authenticate, controllers.user.getUser);
router.get('/users', authenticate, isAdmin, controllers.user.listUsers);
router.post('/users/:userId/ban', authenticate, isAdmin, controllers.user.banUser);
router.post('/users/:userId/unban', authenticate, isAdmin, controllers.user.unbanUser);
router.post('/users/:userId/balance', authenticate, isAdmin, controllers.user.updateBalance);

// ===== WALLET ROUTES =====
router.get('/wallet', authenticate, controllers.wallet.getBalance);
router.get('/wallet/transactions', authenticate, controllers.wallet.getTransactions);
router.post('/wallet/deposit', authenticate, controllers.wallet.deposit);
router.post('/wallet/withdraw', authenticate, controllers.wallet.withdraw);
router.post('/wallet/withdraw/:id/approve', authenticate, isAdmin, controllers.wallet.approveWithdrawal);
router.post('/wallet/withdraw/:id/reject', authenticate, isAdmin, controllers.wallet.rejectWithdrawal);

// ===== CONTENT ROUTES =====
router.post('/content', authenticate, isCreator, upload.single('file'), controllers.content.create);
router.get('/content', controllers.content.list);
router.get('/content/:id', controllers.content.get);
router.put('/content/:id', authenticate, isCreator, controllers.content.update);
router.delete('/content/:id', authenticate, isCreator, controllers.content.delete);
router.post('/content/:id/approve', authenticate, isAdmin, controllers.content.approve);
router.post('/content/:id/like', authenticate, controllers.content.like);

// ===== PRODUCT ROUTES =====
router.post('/products', authenticate, upload.single('file'), controllers.product.create);
router.get('/products', controllers.product.list);
router.get('/products/:id', controllers.product.get);
router.put('/products/:id', authenticate, controllers.product.update);
router.delete('/products/:id', authenticate, controllers.product.delete);
router.post('/products/:id/buy', authenticate, controllers.product.buy);
router.post('/products/:id/approve', authenticate, isAdmin, controllers.product.approve);
router.post('/products/:id/feature', authenticate, isAdmin, controllers.product.feature);

// ===== AD ROUTES =====
router.get('/ads', controllers.ad.list);
router.get('/ads/rewarded', controllers.ad.getRewardedAd);
router.post('/ads/rewarded/watch', authenticate, controllers.ad.watchRewardedAd);
router.post('/ads', authenticate, isAdmin, controllers.ad.create);
router.put('/ads/:id', authenticate, isAdmin, controllers.ad.update);
router.delete('/ads/:id', authenticate, isAdmin, controllers.ad.delete);

// ===== OFFER ROUTES =====
router.get('/offers', controllers.offer.list);
router.post('/offers/complete', authenticate, controllers.offer.complete);

// ===== REFERRAL ROUTES =====
router.get('/referrals', authenticate, controllers.referral.getReferrals);
router.get('/referrals/stats', authenticate, controllers.referral.getStats);
router.get('/referrals/leaderboard', controllers.referral.getLeaderboard);

// ===== CHAT ROUTES =====
router.get('/chats', authenticate, controllers.chat.list);
router.get('/chats/:chatId', authenticate, controllers.chat.get);
router.post('/chats', authenticate, controllers.chat.create);
router.post('/chats/:chatId/messages', authenticate, controllers.chat.sendMessage);
router.put('/chats/:chatId/messages/:messageId/read', authenticate, controllers.chat.markAsRead);

// ===== NOTIFICATION ROUTES =====
router.get('/notifications', authenticate, controllers.notification.list);
router.put('/notifications/:id/read', authenticate, controllers.notification.markAsRead);
router.put('/notifications/read-all', authenticate, controllers.notification.markAllAsRead);
router.post('/notifications', authenticate, isAdmin, controllers.notification.send);

// ===== LEADERBOARD ROUTES =====
router.get('/leaderboard', controllers.leaderboard.get);

// ===== ANALYTICS ROUTES =====
router.get('/analytics', authenticate, isAdmin, controllers.analytics.getDashboard);
router.get('/analytics/revenue', authenticate, isAdmin, controllers.analytics.getRevenue);
router.get('/analytics/users', authenticate, isAdmin, controllers.analytics.getUsers);

// ===== ADMIN ROUTES =====
router.get('/admin/stats', authenticate, isAdmin, controllers.admin.getStats);
router.get('/admin/users', authenticate, isAdmin, controllers.admin.listUsers);
router.get('/admin/withdrawals', authenticate, isAdmin, controllers.admin.listWithdrawals);

module.exports = router;
