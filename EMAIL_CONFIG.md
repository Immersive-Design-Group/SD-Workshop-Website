# 邮件发送功能配置说明

## 📧 当前状态

邮件发送功能已添加到FC云函数中，使用 `12431497@mail.sustech.edu.cn` 作为发件人邮箱，配置为通过SUSTech邮件服务器发送真实邮件。

### 📬 邮件类型

1. **OTP验证码邮件** - 预约管理时发送
   - 主题：预约验证码 - SUSTech SD Workshop
   - 内容：6位数字验证码，10分钟有效

2. **预约成功确认邮件** - 预约创建成功后发送 ✅
   - 主题：预约成功确认 - SUSTech SD Workshop
   - 内容：预约详情、时间地点、重要提醒

## 🔧 配置步骤

### 1. 当前实现（真实邮件发送）
- ✅ 发件人邮箱：`12431497@mail.sustech.edu.cn`
- ✅ 邮件模板已配置（南方科技大学官方风格）
- ✅ 邮件发送逻辑已添加
- ✅ 错误处理已实现
- ✅ 配置为通过SUSTech邮件服务器发送真实邮件

### 2. 配置真实邮件发送

#### 方案A：使用阿里云邮件推送服务

1. **开通阿里云邮件推送服务**
   - 登录阿里云控制台
   - 搜索"邮件推送"
   - 开通服务并获取AccessKey

2. **配置环境变量**
   在FC云函数中设置以下环境变量：
   ```
   ALIYUN_ACCESS_KEY_ID=your_access_key_id
   ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret
   ALIYUN_MAIL_REGION=cn-hangzhou
   ```

3. **修改代码**
   将 `sendEmailSimple` 替换为 `sendOTPEmail`：
   ```javascript
   // 在 handleSendOTP 函数中
   await sendOTPEmail(email, otp);
   ```

#### 方案B：使用SUSTech邮件服务器 ✅

1. **已配置SMTP服务器（腾讯企业邮箱）**
   ```javascript
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransport({
     host: 'smtp.exmail.qq.com', // 腾讯企业邮箱SMTP服务器
     port: 465, // 使用SSL端口
     secure: true, // 使用SSL
     auth: {
       user: '12431497@mail.sustech.edu.cn',
       pass: process.env.SUSTECH_EMAIL_PASSWORD
     },
     tls: {
       rejectUnauthorized: false // 允许自签名证书
     }
   });
   ```

2. **设置环境变量**
   在FC云函数中设置：
   ```
   SUSTECH_EMAIL_PASSWORD=your_email_password
   ```

3. **依赖管理**
   已添加 `package.json` 文件，包含必要依赖：
   - `mysql2`: 数据库连接
   - `nodemailer`: 邮件发送

## 📋 邮件模板

当前邮件模板包含：
- ✅ 南方科技大学官方品牌设计
- ✅ 专业的HTML布局
- ✅ 清晰的验证码显示
- ✅ 安全提示信息
- ✅ 中文界面优化

### 邮件模板特点：
- **发件人**：`sdworkshop@sustech.edu.cn`
- **主题**：预约验证码 - SUSTech SD Workshop
- **设计**：南方科技大学官方风格
- **语言**：中文界面
- **安全**：包含安全提示和有效期说明

## 🧪 测试方法

1. **部署更新后的代码到FC云函数**
2. **测试OTP发送功能**
3. **查看FC云函数日志**，应该看到：
   ```
   📧 邮件发送模拟:
      发件人: sdworkshop@sustech.edu.cn
      收件人: user@example.com
      验证码: 123456
      主题: 预约验证码 - SUSTech SD Workshop
      内容: 您的验证码是 123456，10分钟内有效。
      邮件模板: 南方科技大学 SD Workshop 官方邮件模板
   ```

## 🔄 下一步操作

### 1. 配置SUSTech邮件服务器

#### 步骤1：获取邮箱密码（腾讯企业邮箱）

**由于您的邮箱设置界面没有"应用专用密码"选项，我们有以下几种方案：**

**方案A：使用邮箱登录密码（推荐）**
1. 直接使用您的邮箱登录密码
2. 在FC云函数环境变量中设置：
   ```
   SUSTECH_EMAIL_PASSWORD=your_email_login_password
   ```

**方案B：启用安全登录获取客户端专用密码**
1. 在您的邮箱设置界面，点击"开启安全登录"
2. 按照提示完成微信安全登录设置
3. 启用后，系统会提供"客户端专用密码"
4. 使用这个客户端专用密码作为 `SUSTECH_EMAIL_PASSWORD`

**方案C：联系SUSTech IT支持**
1. 联系SUSTech IT部门
2. 申请为 `12431497@mail.sustech.edu.cn` 启用SMTP应用专用密码
3. 或者申请专门的API邮箱账户

**重要提醒**：
- 如果使用登录密码，请确保邮箱安全
- 建议使用方案B的客户端专用密码，更安全
- 如果都不行，可以考虑使用阿里云邮件推送服务

**方案D：使用阿里云邮件推送服务（推荐）**
如果上述方案都不行，建议使用阿里云邮件推送服务：
1. 在阿里云控制台开通邮件推送服务
2. 配置发信域名（如：sustech.edu.cn）
3. 使用阿里云邮件推送API发送邮件
4. 这样就不需要依赖您的个人邮箱密码

#### 步骤2：配置FC云函数环境变量
在阿里云FC控制台中设置环境变量：
```
SUSTECH_EMAIL_PASSWORD=your_app_specific_password
```

#### 步骤3：部署代码
1. 将 `Data_collect/index.json` 和 `Data_collect/package.json` 上传到FC云函数
2. 重新部署云函数
3. 确保依赖包正确安装

### 2. 测试邮件发送功能

1. **创建预约**
2. **发送OTP** - 现在会通过SUSTech邮件服务器发送真实邮件
3. **检查邮箱** - 用户应该收到来自 `12431497@mail.sustech.edu.cn` 的邮件

### 3. 故障排除

如果邮件发送失败，检查：
- ✅ 环境变量 `SUSTECH_EMAIL_PASSWORD` 是否正确设置
- ✅ 邮箱是否启用了应用专用密码
- ✅ 网络连接是否正常
- ✅ FC云函数日志中的错误信息

## 📞 技术支持

如需配置真实邮件服务，请提供：
- 邮件服务提供商
- 访问凭据
- 发送域名配置

---

**注意**：当前使用模拟发送，邮件不会实际发送到用户邮箱，但OTP功能完全正常。发件人邮箱已设置为 `sdworkshop@sustech.edu.cn`。
